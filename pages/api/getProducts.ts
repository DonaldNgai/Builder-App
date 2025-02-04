// pages/api/catalogProducts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';

interface Product {
  name: string;
  url: string;   // the unique (relative) portion of the URL
  price: number; // price as a number
}

/**
 * Helper function to fetch the HTML content of a URL.
 */
async function fetchHTML(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }
  return res.text();
}

/**
 * Extracts products from a given collection URL.
 * It loads the first page to determine the total number of products
 * (by searching for text like "of X products") and then paginates accordingly.
 */
async function getProductsFromCollection(collectionUrl: string): Promise<Product[]> {
  const products: Product[] = [];
  const firstPageUrl = `${collectionUrl}?page=1`;
  console.log(`Fetching first page: ${firstPageUrl}`);

  let html: string;
  try {
    html = await fetchHTML(firstPageUrl);
  } catch (error) {
    console.error(`Error fetching ${firstPageUrl}: ${error}`);
    return products;
  }
  const $ = cheerio.load(html);

  // Extract total product count from text (e.g., "of 83 products")
  const bodyText = $.text();
  const productCountMatch = bodyText.match(/of\s+(\d+)\s+products?/i);
  let totalProducts = 0;
  if (productCountMatch && productCountMatch[1]) {
    totalProducts = parseInt(productCountMatch[1], 10);
    console.log(`Found total products: ${totalProducts}`);
  } else {
    console.warn(`Could not determine total product count for ${collectionUrl}.`);
  }

  // Function to extract product info from a Cheerio instance.
  const extractProducts = ($page: cheerio.Root) => {
    // Each product is within an element with the class "product-item__info-inner"
    const productElements = $page('.product-item__info-inner');
    productElements.each((i, element) => {
      const name = $(element).find('a.product-item__title').text().trim();
      // Get the relative URL (e.g. "/products/pickleball-tutor-plus-ultra") and remove any query parameters.
      const relativeUrl = $(element).find('a.product-item__title').attr('href')?.split('?')[0] || '';
      // Clean the price text (remove any non-digit and non-period characters) and convert to a number.
      let priceText = $(element).find('.price').text().trim();
      priceText = priceText.replace(/[^0-9.]/g, '');
      const price = parseFloat(priceText);
      
      if (name && relativeUrl && !isNaN(price)) {
        products.push({
          name,
          url: relativeUrl,
          price,
        });
      }
    });
  };

  // Extract products from the first page.
  extractProducts($);

  // Determine products per page and compute total pages.
  const productsPerPage = $('.product-item__info-inner').length;
  let totalPages = 1;
  if (totalProducts > 0 && productsPerPage > 0) {
    totalPages = Math.ceil(totalProducts / productsPerPage);
  }
  console.log(`Expecting ${totalPages} pages for ${collectionUrl}`);

  // Fetch additional pages if necessary.
  for (let page = 2; page <= totalPages; page++) {
    const url = `${collectionUrl}?page=${page}`;
    console.log(`Fetching collection page: ${url}`);
    try {
      const pageHtml = await fetchHTML(url);
      const $$ = cheerio.load(pageHtml);
      if ($$('.product-item__info-inner').length === 0) {
        console.log(`No products found on ${url}; ending pagination.`);
        break;
      }
      extractProducts($$);
    } catch (error) {
      console.error(`Error fetching ${url}: ${error}`);
      break;
    }
  }
  return products;
}

/**
 * The Next.js API handler that gathers products.
 * A full starting URL must be provided via the "startUrl" query parameter.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const collectionUrls: string[] = [];
    const { startUrl } = req.query;
    if (startUrl && typeof startUrl === 'string') {
      // Use the provided full start URL (strip any query parameters)
      collectionUrls.push(startUrl.split('?')[0]);
    } else {
      return res.status(400).json({ error: 'A full startUrl query parameter is required.' });
    }
    console.log('Collection URL to process:', collectionUrls);

    // Extract the base URL from the provided startUrl.
    const baseUrl = new URL(collectionUrls[0]).origin;

    let allProducts: Product[] = [];
    for (const collectionUrl of collectionUrls) {
      console.log(`Processing collection: ${collectionUrl}`);
      const products = await getProductsFromCollection(collectionUrl);
      console.log(`Found ${products.length} products in collection ${collectionUrl}`);
      allProducts = allProducts.concat(products);
    }

    // Deduplicate products based on the relative URL.
    const dedupedProducts = allProducts.filter((product, index, self) =>
      index === self.findIndex((p) => p.url === product.url)
    );
    console.log(`Total unique products: ${dedupedProducts.length}`);

    // Return the JSON response with the baseUrl and the deduplicated product list.
    res.status(200).json({
      baseUrl,
      products: dedupedProducts,
    });
  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ error: 'An error occurred while fetching products.' });
  }
}
