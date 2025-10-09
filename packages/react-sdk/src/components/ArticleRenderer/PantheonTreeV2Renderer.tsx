import { PantheonTreeNode } from "@pantheon-systems/pcc-sdk-core/types";
import React from "react";
import { ComponentMap, SmartComponentMap } from ".";
import { convertAttributes } from "../../utils/attributes";
import { CDNDomains } from "../../utils/cdn-domains";
import { getStyleObjectFromString } from "../../utils/styles";
import { withSmartComponentErrorBoundary } from "./SmartComponentErrorBoundary";

interface Props {
  element: PantheonTreeNode;
  smartComponentMap?: SmartComponentMap;
  componentMap?: ComponentMap;
  disableAllStyles?: boolean;
  preserveImageStyles?: boolean;
  disableDefaultErrorBoundaries?: boolean;
  renderImageCaptions?: boolean;
  cdnURLOverride?: string | ((url: string) => string);
}

const PantheonTreeRenderer = ({
  element,
  smartComponentMap,
  componentMap,
  disableAllStyles,
  preserveImageStyles,
  disableDefaultErrorBoundaries,
  renderImageCaptions,
  cdnURLOverride,
}: Props): React.ReactElement | null => {
  const children =
    element.children?.map((child, idx) =>
      React.createElement(PantheonTreeRenderer, {
        key: idx,
        element: {
          ...child,
          prevNode: element.children[idx - 1],
          nextNode: element.children[idx + 1],
        },
        smartComponentMap,
        componentMap,
        disableAllStyles,
        preserveImageStyles,
        disableDefaultErrorBoundaries,
        renderImageCaptions,
        cdnURLOverride,
      }),
    ) ?? [];

  if (element.tag === "component") {
    const componentType = element.type?.toUpperCase();

    if (!componentType) {
      return null;
    }

    const component = smartComponentMap?.[componentType];

    if (component) {
      if (!component.reactComponent) {
        return (
          <div>
            Error: Cannot render {componentType} because it was provided without
            a reactComponent property.
          </div>
        );
      }

      return disableDefaultErrorBoundaries
        ? React.createElement(
            component.reactComponent,
            element.attrs as Record<string, unknown>,
          )
        : withSmartComponentErrorBoundary(component.reactComponent)(
            element.attrs as Record<string, unknown>,
          );
    }
  }

  if (element.tag === "style") {
    if (disableAllStyles) return null;

    // `renderToStaticMarkup` will escape the HTML entities in the style tag
    // https://github.com/facebook/react/issues/13838#issuecomment-470294454
    return React.createElement("style", {
      dangerouslySetInnerHTML: {
        __html: element.data,
      },
    });
  }

  const nodeChildren = [element.data, ...children].filter(Boolean);
  const convertedTagName = element.tag === "title" ? "h1" : element.tag;
  const componentOverride = componentMap?.[element.tag as "div"];
  const shouldPruneStyles =
    disableAllStyles === true &&
    (element.tag !== "img" || !preserveImageStyles) &&
    (typeof componentOverride === "string" || componentOverride == null);

  const targetingClasses = [];
  const styleObject = shouldPruneStyles
    ? undefined
    : getStyleObjectFromString(element?.style);

  if (isImageContainer(element) && children.length === 1) {
    targetingClasses.push("pantheon-img-container");

    if (styleObject?.float === "left") {
      targetingClasses.push("pantheon-img-container-breakleft");
    } else if (styleObject?.float === "right") {
      targetingClasses.push("pantheon-img-container-breakright");
    } else if (styleObject?.clear === "both") {
      targetingClasses.push("pantheon-img-container-breakboth");
    } else {
      targetingClasses.push("pantheon-img-container-inline");

      if (
        (element.prevNode == null || !isImageContainer(element.prevNode)) &&
        (element.nextNode == null || !isImageContainer(element.nextNode))
      ) {
        targetingClasses.push("pantheon-img-container-alone");
      }
    }

    const imageChild = isOldImageContainer(element)
      ? element.children[0]
      : element.children[0].children[0];
    const imageTitle = imageChild.attrs?.title?.trim();

    if (imageChild.attrs.src && cdnURLOverride) {
      try {
        const srcUrl = new URL(imageChild.attrs.src);

        if (CDNDomains.includes(srcUrl.hostname)) {
          if (typeof cdnURLOverride === "function") {
            imageChild.attrs.src = cdnURLOverride(srcUrl.toString());
          } else {
            srcUrl.hostname = cdnURLOverride;
            imageChild.attrs.src = srcUrl.toString();
          }
        }
      } catch (err) {
        // If it's not a valid URL (or cannot be parsed), leave it unchanged.
      }
    }

    if (renderImageCaptions !== false && imageTitle?.length) {
      nodeChildren.push(
        <span
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            fontSize: ".75rem",
          }}
          className="pantheon-caption"
        >
          {imageTitle}
        </span>,
      );
    }
  }

  return React.createElement(
    componentOverride || convertedTagName,
    {
      style: styleObject,
      ...convertAttributes({
        ...element.attrs,
        class: [element.attrs?.class, ...targetingClasses]
          .filter(Boolean)
          .join(" "),
      }),
    },
    nodeChildren.length ? nodeChildren : undefined,
  );
};

function isOldImageContainer(element: PantheonTreeNode<string>) {
  return (
    element.tag === "span" &&
    element.children?.[0].tag === "img" &&
    element.children.length === 1
  );
}

function isImageContainer(element: PantheonTreeNode<string>) {
  return (
    element.tag === "span" &&
    (isOldImageContainer(element) ||
      (element.children?.[0].tag === "span" &&
        element.children.length === 1 &&
        element.children?.[0].children?.[0].tag === "img" &&
        element.children[0].children?.length === 1))
  );
}

export default PantheonTreeRenderer;
