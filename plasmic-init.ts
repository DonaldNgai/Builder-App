import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";
import CatalogDownloader from '@/components/catalog-downloader';

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "cEEAGxuEpnGVuAPSAN9WbW",
      token: "3Qew6woJxlXvay3Yq1Nt7sLH8oVmdZWrnsVi1n7rBJmoMuA3KAarXHLGU15wNudfHlyPK1S6we3c1zfL0cyA",
    },
  ],

  // By default Plasmic will use the last published version of your project.
  // For development, you can set preview to true, which will use the unpublished
  // project, allowing you to see your designs without publishing.  Please
  // only use this for development, as this is significantly slower.
  preview: false,
});

// You can register any code components that you want to use here; see
// https://docs.plasmic.app/learn/code-components-ref/
// And configure your Plasmic project to use the host url pointing at
// the /plasmic-host page of your nextjs app (for example,
// http://localhost:3000/plasmic-host).  See
// https://docs.plasmic.app/learn/app-hosting/#set-a-plasmic-project-to-use-your-app-host

PLASMIC.registerComponent(CatalogDownloader, {
  name: 'CatalogDownloader',
  props: {
    downloadUrl: 'string',
    buttonText: 'string',
    children: 'slot',
    header: 'slot',
    darkMode: 'boolean',
    elevation: {
      type: 'choice',
      options: ['high', 'medium', 'flat']
    },
    config: 'object',
    headerColor: {
      type: 'choice',
      hidden: (props) => !props.header,
      options: (props) => props.darkMode ? ['black', 'blue'] : ['yellow', 'green']
    }
  }
});
