import React, { useState } from 'react';

export default function CatalogDownloader() {
  // Holds the starting URL from the input.
  const [startUrl, setStartUrl] = useState('');
  // Holds the JSON data returned from the API.
  const [data, setData] = useState(null);
  // Tracks whether the API call is in progress.
  const [loading, setLoading] = useState(false);

  // Update the input field.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartUrl(e.target.value);
    // Clear any previously fetched data if the user edits the URL.
    setData(null);
  };

  // Calls the backend endpoint using the provided startUrl.
  const handleFetch = async () => {
    if (!startUrl) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/catalogProducts?startUrl=${encodeURIComponent(startUrl)}`
      );
      if (!response.ok) {
        throw new Error('Error fetching product data');
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
      alert('An error occurred while fetching data.');
    }
    setLoading(false);
  };

  // Triggers a download of the JSON data.
  const handleDownload = () => {
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <input
        type="text"
        value={startUrl}
        onChange={handleInputChange}
        placeholder="Enter full starting URL (e.g. https://www.example.com/collections/all)"
        style={{ padding: '0.5rem', fontSize: '1rem' }}
      />
      <button
        onClick={handleFetch}
        disabled={!startUrl || loading}
        style={{ padding: '0.5rem', fontSize: '1rem' }}
      >
        {loading ? 'Fetching...' : 'Fetch Products'}
      </button>
      {data && (
        <button
          onClick={handleDownload}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        >
          Download JSON
        </button>
      )}
    </div>
  );
}
