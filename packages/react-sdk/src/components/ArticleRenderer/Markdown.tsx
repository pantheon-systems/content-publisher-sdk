import { ClassAttributes, HTMLAttributes } from "react";
import ReactMarkdown, { ExtraProps } from "react-markdown";
import { Components } from "react-markdown/lib";
import rehypeRaw from "rehype-raw";
import remarkHeaderId from "remark-heading-id";
import { visit } from "unist-util-visit";
import type { UnistParent } from "unist-util-visit/lib";
import type { ComponentMap, SmartComponentMap } from ".";
import { CDNDomains } from "../../utils/cdn-domains";
import { withSmartComponentErrorBoundary } from "./SmartComponentErrorBoundary";

interface MarkdownRendererProps {
  children: string;
  smartComponentMap?: SmartComponentMap;
  componentMap?: ComponentMap;
  disableDefaultErrorBoundaries: boolean;
  cdnURLOverride?: string | ((url: string) => string);
}

interface ComponentProperties {
  attrs: string;
  id: string;
  type: string;
}

const MarkdownRenderer = ({
  children,
  smartComponentMap,
  componentMap,
  disableDefaultErrorBoundaries,
  cdnURLOverride,
}: MarkdownRendererProps) => {
  return (
    <ReactMarkdown
      rehypePlugins={[
        rehypeRaw,
        fixComponentParentRehypePlugin,
        overrideCDNUrls(cdnURLOverride),
      ]}
      remarkPlugins={[remarkHeaderId]}
      components={{
        ...(componentMap as Components),
        ["pcc-component" as "div"]: ({
          node,
        }: ClassAttributes<HTMLDivElement> &
          HTMLAttributes<HTMLDivElement> &
          ExtraProps) => {
          if (!node) {
            console.warn("No replacement found");
            return null;
          }

          const { attrs, type } = node.properties as typeof node.properties &
            ComponentProperties;

          if (smartComponentMap && smartComponentMap[type]) {
            const { reactComponent: Component } = smartComponentMap[type];
            const decodedAttrs = isomorphicBase64Decode(attrs);

            if (!Component) {
              return (
                <div>
                  Error: Cannot render {type} because it was provided without a
                  reactComponent property.
                </div>
              );
            }

            return (
              <div>
                {disableDefaultErrorBoundaries ? (
                  <Component {...decodedAttrs} />
                ) : (
                  withSmartComponentErrorBoundary(Component)(decodedAttrs)
                )}
              </div>
            );
          }

          return (
            <div className="pcc-component">
              <u>PCC Component - {type}</u>
            </div>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

function isomorphicBase64Decode(str: string): Record<string, unknown> {
  try {
    let stringifiedJSON: string | undefined;
    if (typeof Buffer !== "undefined") {
      stringifiedJSON = Buffer.from(str, "base64").toString("utf8");
    } else if (typeof atob !== "undefined") {
      stringifiedJSON = atob(str);
    }

    if (!stringifiedJSON) throw new Error("Failed to decode base64 string");

    return JSON.parse(stringifiedJSON);
  } catch (e) {
    console.error(e);
    return {};
  }
}

/**
 * Rehype plugin to set the parent of a pcc-component node to a div
 * to fix hydration errors from the component being nested in an invalid parent.
 */
function fixComponentParentRehypePlugin() {
  return (tree: UnistParent) => {
    visit(
      tree,
      { type: "element", tagName: "pcc-component" },
      (node, _, parent) => {
        if (
          parent &&
          "tagName" in parent &&
          // @ts-expect-error TODO: Type this properly
          parent.tagName !== "div"
        ) {
          // @ts-expect-error TODO: Type this properly
          parent.tagName = "div";
        }
      },
    );
  };
}

/**
 * Rehype plugin to override the CDN domain.
 */
function overrideCDNUrls(cdnURLOverride?: string | ((url: string) => string)) {
  // If cdnURLOverride is not provided, return a no-op transformer:
  if (!cdnURLOverride) {
    return () => (tree: UnistParent) => tree;
  }

  return () => (tree: UnistParent) => {
    visit(
      tree,
      "element",
      (node: Element & { properties: { src: string } }) => {
        try {
          if (node.tagName === "img" && node.properties.src) {
            const src = node.properties.src;
            const url = new URL(src);

            if (CDNDomains.includes(url.hostname)) {
              if (typeof cdnURLOverride === "function") {
                node.properties.src = cdnURLOverride(url.toString());
              } else {
                url.hostname = cdnURLOverride;
                node.properties.src = url.toString();
              }
            }
          }
        } catch {
          // If it's not a valid URL (or cannot be parsed), leave it unchanged.
        }
      },
    );
  };
}

export default MarkdownRenderer;
