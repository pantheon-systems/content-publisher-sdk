import { computed, defineComponent, h, PropType } from "vue-demi";
import type { ComponentMap, SmartComponentMap } from "./";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkHeadingId from "remark-heading-id";
import rehypeRaw from "rehype-raw";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx } from "vue/jsx-runtime";
import type { UnistParent } from "unist-util-visit/lib";
import { visit } from "unist-util-visit";

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

// TODO: Check if need URL transform
// export function urlTransform(value: any) {
//   // Same as:
//   // <https://github.com/micromark/micromark/blob/929275e/packages/micromark-util-sanitize-uri/dev/index.js#L34>
//   // But without the `encode` part.
//   const colon = value.indexOf(":");
//   const questionMark = value.indexOf("?");
//   const numberSign = value.indexOf("#");
//   const slash = value.indexOf("/");

//   if (
//     // If there is no protocol, it’s relative.
//     colon < 0 ||
//     // If the first colon is after a `?`, `#`, or `/`, it’s not a protocol.
//     (slash > -1 && colon > slash) ||
//     (questionMark > -1 && colon > questionMark) ||
//     (numberSign > -1 && colon > numberSign) ||
//     // It is a protocol, it should be allowed.
//     safeProtocol.test(value.slice(0, colon))
//   ) {
//     return value;
//   }

//   return "";
// }

// function transform(node: any, index: any, parent: any) {
//   if (node.type === "raw" && parent && typeof index === "number") {
//     parent.children[index] = { type: "text", value: node.value };
//     return index;
//   }

//   if (node.type === "element") {
//     /** @type {string} */
//     let key;

//     for (key in urlAttributes) {
//       if (
//         Object.hasOwn(urlAttributes, key) &&
//         Object.hasOwn(node.properties, key)
//       ) {
//         const value = node.properties[key];
//         const test = urlAttributes[key];
//         if (test === null || test.includes(node.tagName)) {
//           node.properties[key] = urlTransform(String(value || ""));
//         }
//       }
//     }
//   }
// }

const MarkdownRenderer = defineComponent({
  name: "VueMarkdown",
  props: {
    source: {
      type: String,
      required: true,
    },
    smartComponentMap: {
      type: Object as PropType<SmartComponentMap>,
      default: () => ({}),
      required: false,
    },
    componentMap: {
      type: Object as PropType<ComponentMap>,
      default: () => ({}),
      required: false,
    },
  },
  render() {
    const props = this.$props;
    const attrs = this.$attrs;

    const content = computed(() => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkHeadingId)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw as any, { allowDangerousHtml: true })
        .use(fixComponentParentRehypePlugin);

      const mdastTree = processor.parse(props.source);
      const hastTree = processor.runSync(mdastTree);
      // TODO: Check if we need transform
      // visit(hastTree, transform)
      return hastTree;
    });

    const pccComponent = buildPccCustomComponent(props.smartComponentMap);
    return h(
      "div",
      {
        ...attrs,
      },
      toJsxRuntime(content.value, {
        Fragment,
        components: {
          ["pcc-component" as "div"]: pccComponent,
          ...props.componentMap,
        },
        jsx: jsx,
        jsxs: jsx,
      }),
    );
  },
});

interface ComponentProps extends Record<string, unknown> {
  id: string;
  attrs: string;
  type: string;
}

const buildPccCustomComponent = (smartComponentMap: SmartComponentMap) => {
  return defineComponent({
    props: {
      id: {
        type: String,
        required: true,
      },
      attrs: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
    },
    render(props: ComponentProps) {
      const { attrs, type } = props;

      const component = smartComponentMap?.[type];

      const decodedAttrs = isomorphicBase64Decode(attrs);

      return h(
        "div",
        {
          class: "pcc-component",
        },
        // Browsers will dedupe these requests automatically
        component
          ? h(component, decodedAttrs)
          : h("u", {}, `PCC Component - ${type}`),
      );
    },
  });
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

export default MarkdownRenderer;
