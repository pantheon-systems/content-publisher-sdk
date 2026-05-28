import { TreePantheonContent } from "@pantheon-systems/pcc-sdk-core/types";
import { defineComponent, h, PropType } from "vue-demi";
import { SmartComponentMap } from "../index";
import TreeRenderer from "./TreeRenderer";

export default defineComponent({
  name: "PantheonTreeRenderer",
  props: {
    element: {
      type: Object as PropType<TreePantheonContent>,
      required: true,
    },
    smartComponentMap: {
      type: Object as PropType<SmartComponentMap>,
      required: false,
    },
  },
  render() {
    const { element, smartComponentMap } = this.$props;

    if (element.tag === "hr") {
      return h("hr");
    }

    const children = element.children
      ? h(TreeRenderer, {
          x: element.children,
          smartComponentMap,
        })
      : [];

    const headerTags = ["h1", "h2", "h3", "h4", "h5", "h6"];

    if (headerTags.includes(element.tag)) {
      return h(element.tag, { attrs: element.attrs }, children);
    }

    if (element.tag === "table") {
      return h("table", { class: "text-black" }, [h("tbody", {}, children)]);
    }

    if (element.tag === "p" || element.tag === "span") {
      return h("div", {}, children);
    }
    if (element.tag === "ul" && element.children?.length) {
      return h("ul", {}, children);
    }
    if (element.tag === "ol" && element.children?.length) {
      return h("ol", {}, children);
    }
    if (element.tag === "component") {
      return h(TreeRenderer, {
        x: element,
        smartComponentMap,
      });
    }
    return null;
  },
});
