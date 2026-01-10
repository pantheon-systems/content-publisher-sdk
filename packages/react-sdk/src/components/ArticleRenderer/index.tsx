import { findTab } from "@pantheon-systems/cpub-sdk-core";
import {
  Article,
  PantheonTreeNode,
  TabTree,
  type SmartComponentMap as CoreSmartComponentMap,
} from "@pantheon-systems/cpub-sdk-core/types";
import { Element } from "hast";
import React, { useEffect, useMemo } from "react";
import { getTextContent } from "../../utils/react-element";
import MarkdownRenderer from "./Markdown";
import PantheonTreeV2Renderer from "./PantheonTreeV2Renderer";

export { getArticleTitle, useArticleTitle } from "./useArticleTitle";

export type ServersideSmartComponentMap = {
  [K in keyof CoreSmartComponentMap]: CoreSmartComponentMap[K];
};

export type SmartComponentMap = {
  [K in keyof CoreSmartComponentMap]: CoreSmartComponentMap[K] & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reactComponent: (props: any) => React.JSX.Element;
  };
};

type ExtraProps = {
  // If Content type is Markdown
  node?: Element;
};

export type ComponentMap = Partial<{
  [TagName in keyof React.JSX.IntrinsicElements]:
    | (new (
        props: React.JSX.IntrinsicElements[TagName] & ExtraProps,
      ) => React.JSX.ElementClass)
    // Function component:
    | ((
        props: React.JSX.IntrinsicElements[TagName] & ExtraProps,
      ) => React.JSX.Element)
    // Tag name:
    | keyof React.JSX.IntrinsicElements;
}>;

interface Props {
  article?: Article;
  tabId?: string | null;
  bodyClassName?: string;
  containerClassName?: string;
  headerClassName?: string;
  renderTitle?: (
    titleElement: React.ReactElement,
    content: string,
  ) => React.ReactNode;
  smartComponentMap?: SmartComponentMap;
  componentMap?: ComponentMap;
  renderBody?: (bodyElement: React.ReactElement) => React.ReactNode;
  __experimentalFlags?: {
    disableAllStyles?: boolean;
    preserveImageStyles?: boolean;
    disableDefaultErrorBoundaries?: boolean;
    renderImageCaptions?: boolean;
    cdnURLOverride?: string | ((url: string) => string);
  };
}

function UnboxContent(content: string | unknown) {
  if (typeof content !== "string") return content;

  try {
    return JSON.parse(content);
  } catch (e) {
    return content;
  }
}

function splitTitleAndBody(nodes: PantheonTreeNode[]): {
  titleContent: PantheonTreeNode | null;
  bodyNodes: PantheonTreeNode[];
} {
  const indexOfFirstHeader = nodes.findIndex((x) =>
    ["h1", "h2", "h3", "h4", "h5", "h6", "h7", "title"].includes(x.tag),
  );
  const indexOfFirstParagraph = nodes.findIndex((x) => x.tag === "p");
  const resolvedTitleIndex =
    indexOfFirstHeader === -1 ? indexOfFirstParagraph : indexOfFirstHeader;

  if (resolvedTitleIndex < 0) {
    return { titleContent: null, bodyNodes: nodes };
  }

  const titleContent = nodes[resolvedTitleIndex] ?? null;
  const bodyNodes = nodes.filter((_, i) => i !== resolvedTitleIndex);

  return { titleContent, bodyNodes };
}

const ArticleRenderer = ({
  article,
  tabId,
  bodyClassName,
  containerClassName,
  headerClassName,
  renderTitle,
  smartComponentMap,
  componentMap,
  renderBody,
  __experimentalFlags,
}: Props) => {
  useEffect(() => {
    if (renderTitle) {
      console.warn(
        "PCC Deprecation Warning: ArticleRenderer's renderTitle will no longer be supported in a future release.",
      );
    }
  }, [renderTitle]);

  const contentType = article?.contentType;
  const unboxedContent = useMemo(
    () =>
      article?.resolvedContent ? UnboxContent(article.resolvedContent) : null,
    [article?.resolvedContent],
  );

  const contentToShow = useMemo(() => {
    if (!unboxedContent) return null;

    const content =
      (tabId != null && findTab(unboxedContent, tabId)?.documentTab) ||
      unboxedContent;

    if (
      tabId == null &&
      typeof unboxedContent === "object" &&
      content?.children == null
    ) {
      return Array.isArray(unboxedContent)
        ? unboxedContent[0]?.documentTab
        : (unboxedContent as TabTree<any>)?.documentTab;
    }

    return content;
  }, [tabId, unboxedContent]);

  if (!contentToShow) {
    return null;
  }

  if (contentType === "TEXT_MARKDOWN") {
    return (
      <div className={containerClassName}>
        {contentToShow ? (
          <MarkdownRenderer
            smartComponentMap={smartComponentMap}
            componentMap={componentMap}
            disableDefaultErrorBoundaries={
              !!__experimentalFlags?.disableDefaultErrorBoundaries
            }
            cdnURLOverride={__experimentalFlags?.cdnURLOverride}
          >
            {contentToShow}
          </MarkdownRenderer>
        ) : (
          <span>No content to display</span>
        )}
      </div>
    );
  }

  const nodes: PantheonTreeNode[] = contentToShow.children || [];
  const { titleContent, bodyNodes: splitBodyNodes } = splitTitleAndBody(nodes);

  let titleElement = null;

  if (renderTitle != null && titleContent) {
    titleElement = React.createElement(PantheonTreeV2Renderer, {
      element: titleContent,
      componentMap,
      smartComponentMap,
      disableAllStyles: !!__experimentalFlags?.disableAllStyles,
      preserveImageStyles: !!__experimentalFlags?.preserveImageStyles,
      disableDefaultErrorBoundaries:
        !!__experimentalFlags?.disableDefaultErrorBoundaries,
      renderImageCaptions: __experimentalFlags?.renderImageCaptions !== false,
      cdnURLOverride: __experimentalFlags?.cdnURLOverride,
    });
  }

  const bodyNodes = renderTitle != null ? splitBodyNodes : nodes;

  const bodyElement = (
    <div className={bodyClassName}>
      {bodyNodes?.map((element, idx) =>
        React.createElement(PantheonTreeV2Renderer, {
          key: idx,
          element: {
            ...element,
            prevNode: bodyNodes[idx - 1],
            nextNode: bodyNodes[idx + 1],
          },
          smartComponentMap,
          componentMap,
          disableAllStyles: !!__experimentalFlags?.disableAllStyles,
          preserveImageStyles: !!__experimentalFlags?.preserveImageStyles,
          disableDefaultErrorBoundaries:
            !!__experimentalFlags?.disableDefaultErrorBoundaries,
          renderImageCaptions:
            __experimentalFlags?.renderImageCaptions !== false,
          cdnURLOverride: __experimentalFlags?.cdnURLOverride,
        }),
      )}
    </div>
  );

  return (
    <div className={containerClassName}>
      {titleElement != null ? (
        <div className={headerClassName}>
          {renderTitle
            ? renderTitle(titleElement, getTextContent(titleElement))
            : titleElement}
        </div>
      ) : null}
      {renderBody ? renderBody(bodyElement) : bodyElement}
    </div>
  );
};

export default ArticleRenderer;
