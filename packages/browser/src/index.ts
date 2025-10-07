import { PantheonClient } from "@pantheon-systems/pcc-sdk-core";
import PCCArticle from "./elements/pcc-article";

type Args = {
  siteId?: string;
  token?: string;
  pccHost?: string;

  // apiKey is deprecated.
  apiKey?: string;
};

const { siteId, token, apiKey, pccHost } = document.currentScript
  ?.dataset as Args;

// Validate required arguments
if (!siteId) {
  throw new Error(
    "Missing Pantheon Content Publisher site ID. Provide it as a data-site-id attribute on the script tag.",
  );
}

if (!token && !apiKey) {
  throw new Error(
    "Missing Pantheon Content Publisher Token. Provide it as a data-token attribute on the script tag.",
  );
}

// Initialize the PantheonClient
const pantheonClient = new PantheonClient({
  siteId,
  // Rabbit hole explanation: we cast apiKey to string because typescript thinks we haven't
  // checked if it's undefined earlier and lint doesn't let us force with !
  // Not casting or forcing it will cause typescript to choose
  // the wrong type to enforce which breaks compilation.
  token: token || (apiKey as string),
  pccHost,
});

// Expose the PantheonClient on the window object
if (!window?.__PANTHEON_CLIENT) window.__PANTHEON_CLIENT = pantheonClient;

// Register the custom element
customElements.define("pcc-article", PCCArticle);
