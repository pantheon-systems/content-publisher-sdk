import {
  PantheonAPI,
  PantheonAPIOptions,
} from "@pantheon-systems/pcc-react-sdk";

export const pantheonAPIOptions: PantheonAPIOptions = {
  resolvePath: (article) => `/articles/${article.slug || article.id}`,
};

export default PantheonAPI(pantheonAPIOptions);
