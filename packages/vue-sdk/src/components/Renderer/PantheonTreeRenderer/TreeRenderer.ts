import {
  TreePantheonContent,
  TreePantheonContentSmartComponent,
} from "@pantheon-systems/cpub-sdk-core/types";
import { defineComponent, h, PropType, resolveComponent } from "vue-demi";
import {
  getStyleObjectFromString,
  unescapeHTMLEntities,
} from "../../../utils/renderer";
import type { SmartComponentMap } from "../index";

export default defineComponent({
  name: "TreeRenderer",
  props: {
    x: {
      type: Object as PropType<TreePantheonContent | TreePantheonContent[]>,
      required: true,
    },
    smartComponentMap: {
      type: Object as PropType<SmartComponentMap>,
      required: false,
    },
  },
  render() {
    const { x, smartComponentMap } = this.$props;

    if (Array.isArray(x)) {
      return x.map((span) =>
        h(resolveComponent("TreeRenderer"), { x: span, smartComponentMap }),
      );
    }

    if (x == null) return null;

    const textContent = typeof x === "string" ? x : x.data;
    const styles = getStyleObjectFromString(x?.style);
    const isSuperscript = Boolean(styles?.["vertical-align"] === "super");
    const isSubscript = Boolean(styles?.["vertical-align"] === "sub");

    const articleComponents = ["li", "tr", "td"];

    if (articleComponents.includes(x.tag)) {
      return h(
        x.tag,
        { style: styles, ...x.attrs },
        x.children
          ? h(resolveComponent("TreeRenderer"), {
              x: x.children,
              smartComponentMap,
            })
          : [],
      );
    }

    if (textContent != null) {
      const tag = isSuperscript ? "sup" : isSubscript ? "sub" : "span";
      return h(tag, { style: styles }, unescapeHTMLEntities(textContent));
    }

    if (x.tag === "span" && x.data == null) {
      return h("span", {}, [
        x.children
          ? h(resolveComponent("TreeRenderer"), {
              x: x.children,
              smartComponentMap,
            })
          : null,
      ]);
    }

    if (x.tag === "a") {
      return h("a", {
        href: x.href,
        target: "_blank",
        rel: "noopener noreferrer",
        style: styles,
        domProps: { innerHTML: x.data },
      });
    }

    if (x.tag === "img" || x.tag === "image") {
      return h("img", { src: x.src, alt: x.alt, title: x.title });
    }

    if (x.type === "BLOCKQUOTE") {
      return h("blockquote", {}, [
        h("p", { dir: "ltr" }, "QUOTE TEXT"),
        h("p", { dir: "ltr" }, "- QUOTE ATTRIBUTION"),
      ]);
    }

    if (smartComponentMap?.[x.type?.toUpperCase()] != null) {
      return h(smartComponentMap?.[x.type?.toUpperCase()], {
        ...x.attrs,
        ...(x as TreePantheonContentSmartComponent).attributes,
      });
    }

    return null;
  },
});
