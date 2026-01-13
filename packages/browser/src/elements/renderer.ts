import {
  flattenDocumentTabs,
  type Article,
} from "@pantheon-systems/pcc-sdk-core";
import {
  PantheonTree,
  PantheonTreeNode,
  TabTree,
  TreePantheonContent,
} from "@pantheon-systems/pcc-sdk-core/types";
import _ from "lodash";

export type RendererConfig = {
  disableStyles?: boolean;
  preserveImageStyles?: boolean;
};

export function renderArticleToElement(
  article: Article,
  element: HTMLElement,
  config?: RendererConfig,
) {
  if (!article.resolvedContent) {
    throw new Error(
      "Article has no content. Preview or publish the article to view it here.",
    );
  }

  if (article.contentType !== "TREE_PANTHEON_V2") {
    throw new Error(
      `Unsupported content type: ${article.contentType}. PCC Article only supports TREE_PANTHEON_V2`,
    );
  }

  const jsonContent =
    typeof article.resolvedContent === "string"
      ? (JSON.parse(article.resolvedContent) as
          | PantheonTree
          | TabTree<PantheonTree>[])
      : article.resolvedContent;

  const content: Array<PantheonTreeNode> = Array.isArray(jsonContent)
    ? _.flatMap(
        jsonContent as Array<TabTree<PantheonTree>>,
        flattenDocumentTabs,
      )
    : jsonContent.children;

  // Parent node to be added to the DOM
  const documentNode = document.createElement("div");

  // Add PCC content to the document node
  content.forEach((node) => {
    const contentNode = renderContentNode(node, config);

    if (contentNode) {
      documentNode.appendChild(contentNode);
    }
  });

  // Clear fallback content
  element.innerHTML = "";

  // Append the document node
  element.appendChild(documentNode);

  return element;
}

export const renderContentNode = (
  element: PantheonTreeNode | TreePantheonContent,
  config?: RendererConfig,
): HTMLElement | null => {
  if (config?.disableStyles && element.tag === "style") {
    // Skip rendering style nodes if disableStyles is true
    return null;
  }

  const node = document.createElement(element.tag);

  // Remove styles and classes if disableStyles is true,
  // unless the element is an img and preserveImageStyles is true.
  if (
    config?.disableStyles === true &&
    (element.tag !== "img" || !config.preserveImageStyles)
  ) {
    delete element.style;
    delete element.attrs?.class;
  }

  if (element.attrs) {
    Object.entries(element.attrs).forEach(([key, value]) => {
      node.setAttribute(key, String(value));
    });
  }

  if (element.style && element.style.length > 0) {
    node.setAttribute("style", element.style.join(";"));
  }

  if (element.data) {
    node.innerText = element.data;
  }

  // Render child nodes recursively
  if (element.children) {
    element.children.forEach((child) => {
      const contentNode = renderContentNode(child, config);

      if (contentNode) {
        node.appendChild(contentNode);
      }
    });
  }

  return node;
};
