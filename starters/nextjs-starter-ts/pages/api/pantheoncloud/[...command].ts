import {
  PantheonAPI,
  PantheonAPIOptions,
} from "@pantheon-systems/cpub-react-sdk";
import { getArticleURLFromSiteWithOptions } from "@pantheon-systems/cpub-react-sdk/server";
import { serverSmartComponentMap } from "../../../components/smart-components";
import { getAuthorById, listAuthors } from "../../../lib/pcc-metadata-groups";

export const pantheonAPIOptions: PantheonAPIOptions = {
  resolvePath: getArticleURLFromSiteWithOptions({
    // The base path to use for the URL.
    basePath: "/articles",
    // Maximum depth to include in the URL. If it is -1, it will include all the categories. If it is 0, it will only include the article. If it is 1, it will include the article's slug or id and its immediate parent category and so on.
    maxDepth: -1,
  }),
  smartComponentMap: serverSmartComponentMap,
  componentPreviewPath: (componentName) =>
    `/component-preview/${componentName}`,
  metadataGroups: [
    {
      label: "Author",
      groupIdentifier: "AUTHOR",
      schema: {
        name: "string",
        image: "file",
      },
      get: getAuthorById,
      list: listAuthors,
    },
  ],
};

export default PantheonAPI(pantheonAPIOptions);
