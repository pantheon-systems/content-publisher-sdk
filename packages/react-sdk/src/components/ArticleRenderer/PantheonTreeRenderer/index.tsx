import { TreePantheonContent } from "@pantheon-systems/cpub-sdk-core/types";
import React from "react";
import { SmartComponentMap } from "../index";
import ArticleComponent from "./ArticleComponent";

interface Props {
  element: TreePantheonContent;
  smartComponentMap?: SmartComponentMap;
}

const PantheonTreeRenderer = ({ element, smartComponentMap }: Props) => {
  if (element.tag === "hr") {
    return <hr />;
  }

  const children =
    element.children == null ? null : element.children.length === 1 ? (
      <ArticleComponent
        x={element.children[0]}
        smartComponentMap={smartComponentMap}
      />
    ) : (
      element.children.map((x, i: number) => (
        <ArticleComponent x={x} key={i} smartComponentMap={smartComponentMap} />
      ))
    );

  const articleComponents = ["h1", "h2", "h3", "h4", "h5", "h6"];

  if (articleComponents.includes(element.tag)) {
    return React.createElement(element.tag, { ...element.attrs }, children);
  }

  if (element.tag === "table") {
    return (
      <table className="text-black">
        <tbody>{children}</tbody>
      </table>
    );
  }

  if (element.tag === "p" || element.tag === "span") {
    return <div>{children}</div>;
  }
  if (element.tag === "ul" && element.children?.length) {
    return <ul>{children}</ul>;
  }
  if (element.tag === "ol" && element.children?.length) {
    return <ol>{children}</ol>;
  }
  if (element.tag === "component") {
    return (
      <ArticleComponent x={element} smartComponentMap={smartComponentMap} />
    );
  }
  return null;
};

export default PantheonTreeRenderer;
