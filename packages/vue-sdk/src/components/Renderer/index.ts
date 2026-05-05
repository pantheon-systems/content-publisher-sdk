import {
  Article,
  PantheonTree,
  TreePantheonContent,
} from "@pantheon-systems/cpub-sdk-core/types";
import {
  DefineComponent,
  defineComponent,
  h,
  PropType,
  SlotsType,
  Teleport,
  VNode,
} from "vue-demi";
import PreviewBar from "../Preview/index.vue";
import MarkdownRenderer from "./MarkdownRenderer";
import PantheonTreeRenderer from "./PantheonTreeRenderer";
import PantheonTreeV2Renderer from "./PantheonTreeV2Renderer";

export { getArticleTitle } from "./getArticleTitle";

export type SmartComponentMap = {
  // Can't know prop types of component, so we use any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: InstanceType<DefineComponent<any, any, any>>;
};
export type ComponentMap = {
  // Can't know prop types of component, so we use any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: InstanceType<DefineComponent<any, any, any>>;
};

export type PreviewBarProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previewBarOverride?: InstanceType<DefineComponent<any, any, any>>;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  portalTarget?:
    | InstanceType<DefineComponent<any, any, any>>
    | null
    | undefined;
  /* eslint-enable @typescript-eslint/no-explicit-any*/
};

export type ExperimentalFlags = {
  disableAllStyles?: boolean;
  preserveImageStyles?: boolean;
  disableDefaultErrorBoundaries: boolean;
  useUnintrusiveTitleRendering?: boolean;
  renderImageCaptions?: boolean;
  cdnURLOverride?: string;
};

const pccGeneratedPortalTargetKey = "__pcc-portal-target__";
function getOrCreatePortalTarget(
  targetOverride: globalThis.Element | null | undefined,
) {
  let portalTarget =
    targetOverride || document.getElementById(pccGeneratedPortalTargetKey);

  if (!portalTarget) {
    portalTarget = document.createElement("div");
    portalTarget.id = pccGeneratedPortalTargetKey;
    document.body.prepend(portalTarget);
  }

  return portalTarget;
}

const ArticleRenderer = defineComponent({
  name: "ArticleRenderer",
  props: {
    article: {
      type: Object as PropType<Article>,
      required: true,
    },
    smartComponentMap: {
      type: Object as PropType<SmartComponentMap>,
      required: false,
    },
    componentMap: {
      type: Object as PropType<ComponentMap>,
      required: false,
    },
    bodyClass: {
      type: String,
      required: false,
    },
    headerClass: {
      type: String,
      required: false,
    },
    previewBarProps: {
      type: Object as PropType<PreviewBarProps>,
      required: false,
    },
    __experimentalFlags: {
      type: Object as PropType<ExperimentalFlags>,
      required: false,
    },
  },
  slots: Object as SlotsType<{
    titleRenderer: VNode | undefined;
  }>,
  render() {
    const props = this.$props;
    const slots = this.$slots;

    const portalTarget =
      typeof document !== "undefined"
        ? getOrCreatePortalTarget(this.previewBarProps?.portalTarget)
        : this.previewBarProps?.portalTarget;

    if (!props.article?.content) return null;

    if (props.article.contentType === "TEXT_MARKDOWN") {
      return h("div", {}, [
        props.article.publishingLevel === "REALTIME"
          ? h(Teleport, { to: portalTarget }, [
              h(PreviewBar, { article: props.article }),
            ])
          : null,
        h(MarkdownRenderer, {
          source: props.article.content || "",
          smartComponentMap: props.smartComponentMap,
          componentMap: props.componentMap,
          options: {
            html: true,
          },
          __experimentalFlags: props.__experimentalFlags,
        }),
      ]);
    }

    const content = JSON.parse(props.article.content) as
      | PantheonTree
      | TreePantheonContent[];

    const renderer =
      // V1 content is array of TreePantheonContent
      Array.isArray(content) ? PantheonTreeRenderer : PantheonTreeV2Renderer;

    const parsedContent = Array.isArray(content)
      ? content
      : content.children || [];

    let titleElement = null;

    if (props.__experimentalFlags?.useUnintrusiveTitleRendering !== true) {
      const indexOfFirstHeader = parsedContent.findIndex((x) =>
        ["h1", "h2", "h3", "h4", "h5", "h6", "h7", "title"].includes(x.tag),
      );

      const indexOfFirstParagraph = parsedContent.findIndex(
        (x) => x.tag === "p",
      );
      const resolvedTitleIndex =
        indexOfFirstHeader === -1 ? indexOfFirstParagraph : indexOfFirstHeader;

      const [titleContent] = parsedContent.splice(resolvedTitleIndex, 1);

      titleElement =
        // @ts-expect-error Dynamic component props
        h(renderer, {
          element: titleContent,
          smartComponentMap: props.smartComponentMap,
          componentMap: props.componentMap,
          __experimentalFlags: props.__experimentalFlags,
        });
    }

    return h("div", {}, [
      props.article?.publishingLevel === "REALTIME" && portalTarget != null
        ? h(Teleport, { to: `#${portalTarget?.id}` }, [
            h(PreviewBar, { ...this.previewBarProps, article: props.article }),
          ])
        : null,
      titleElement != null
        ? h(
            "div",
            { class: ["title", props.headerClass] },
            slots.titleRenderer?.(titleElement) ?? titleElement,
          )
        : null,
      h("div", { class: props.bodyClass }, [
        parsedContent.map((element) => {
          // @ts-expect-error Dynamic component props
          return h(renderer, {
            element,
            smartComponentMap: props.smartComponentMap,
            componentMap: props.componentMap,
            __experimentalFlags: props.__experimentalFlags,
          });
        }),
      ]),
    ]);
  },
});

export default ArticleRenderer;
