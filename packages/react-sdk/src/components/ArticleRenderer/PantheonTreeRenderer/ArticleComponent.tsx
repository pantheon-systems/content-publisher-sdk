import type {
  TreePantheonContent,
  TreePantheonContentSmartComponent,
} from "@pantheon-systems/cpub-sdk-core/types";
import * as React from "react";
import { getStyleObjectFromString } from "../../../utils/styles";
import { unescapeHTMLEntities } from "../../../utils/unescape";
import { SmartComponentMap } from "../index";
import PantheonTreeRenderer from "./index";

interface Props {
  x: TreePantheonContent | TreePantheonContent[] | null | undefined;
  smartComponentMap?: SmartComponentMap;
}

const ArticleComponent = ({
  x,
  smartComponentMap,
}: Props): React.ReactElement | null => {
  if (x == null) return null;

  if (Array.isArray(x)) {
    return (
      <>
        {x.map((span, idx) => (
          <ArticleComponent
            key={idx}
            x={span}
            smartComponentMap={smartComponentMap}
          />
        ))}
      </>
    );
  }

  const textContent = typeof x === "string" ? x : x.data;
  const styles = getStyleObjectFromString(x?.style || []);
  const isSuperscript = Boolean(styles?.["vertical-align"] === "super");
  const isSubscript = Boolean(styles?.["vertical-align"] === "sub");

  if (x.tag === "li") {
    return React.createElement(
      x.tag,
      { style: styles, ...x.attrs },
      React.createElement(ArticleComponent, {
        x: x.children,
        smartComponentMap,
      }),
    );
  }

  const tableElements = ["tr", "td"];

  if (tableElements.includes(x.tag)) {
    const { colspan, rowspan, ...attrs } = x.attrs || {};

    const colSpan = colspan ? { colSpan: Number(colspan) } : {};
    const rowSpan = rowspan ? { rowSpan: Number(rowspan) } : {};

    return React.createElement(
      x.tag,
      { style: styles, ...attrs, ...colSpan, ...rowSpan },
      React.createElement(ArticleComponent, {
        x: x.children,
        smartComponentMap,
      }),
    );
  }

  if (textContent?.trim().length) {
    const tag = isSuperscript ? "sup" : isSubscript ? "sub" : "span";
    return React.createElement(
      tag,
      { style: styles },
      unescapeHTMLEntities(textContent),
    );
  }

  if (x.tag === "span" && x.data == null) {
    return (
      <span>
        <ArticleComponent
          x={x.children}
          smartComponentMap={smartComponentMap}
        />
      </span>
    );
  }

  if (x.tag === "p") {
    return (
      <PantheonTreeRenderer element={x} smartComponentMap={smartComponentMap} />
    );
  }

  if (x.tag === "a") {
    return (
      <a
        href={x.href || undefined}
        target="_blank"
        rel="noopener noreferrer"
        style={styles}
      >
        {x.data}
      </a>
    );
  }

  if (x.tag === "img" || x.tag === "image") {
    return (
      <img
        src={x.src || undefined}
        alt={x.alt || undefined}
        title={x.title || undefined}
      />
    );
  }

  if (x.type === "BLOCKQUOTE") {
    return (
      <blockquote>
        <p dir="ltr">QUOTE TEXT</p>
        <p dir="ltr">-&nbsp;QUOTE ATTRIBUTION</p>
      </blockquote>
    );
  }

  if (smartComponentMap?.[x.type?.toUpperCase()] != null) {
    return React.createElement(
      smartComponentMap[x.type.toUpperCase()]?.reactComponent,
      {
        ...x.attrs,
        ...(x as TreePantheonContentSmartComponent).attributes,
      },
    );
  }

  return null;
};

export default ArticleComponent;
