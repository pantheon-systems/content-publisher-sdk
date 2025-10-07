import {
  Article,
  ARTICLE_UPDATE_SUBSCRIPTION,
  getArticleBySlugOrId,
  PublishingLevel,
} from "@pantheon-systems/pcc-sdk-core";
import { RendererConfig, renderArticleToElement } from "./renderer";

class PCCArticle extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    const id = this.getAttribute("id") || undefined;
    const slug = this.getAttribute("slug") || undefined;
    const disableStyles = this.getAttribute("disable-styles") != null;
    const preserveImageStyles =
      this.getAttribute("preserve-image-styles") != null;
    const passedInPublishingLevel =
      this.getAttribute("publishing-level") || undefined;

    if (!id && !slug) {
      throw new Error("PCC Article requires an id or slug attribute");
    }

    const publishingLevel =
      PublishingLevel[passedInPublishingLevel as keyof typeof PublishingLevel];

    const config = {
      disableStyles,
      preserveImageStyles,
      publishingLevel: publishingLevel
        ? publishingLevel
        : // Default to REALTIME
          PublishingLevel.REALTIME,
    };

    await this.fetchAndRenderArticle({ id, slug }, config);
  }

  private async fetchAndRenderArticle(
    {
      id,
      slug,
    }: {
      id?: string;
      slug?: string;
    },
    config?: RendererConfig & { publishingLevel?: PublishingLevel },
  ) {
    if (!window?.__PANTHEON_CLIENT) {
      throw new Error("Missing Pantheon Client");
    }

    if (!id && !slug) {
      throw new Error("PCC Article requires an id or slug attribute");
    }

    const article = await getArticleBySlugOrId(
      window.__PANTHEON_CLIENT,
      id || slug || "",
      {
        contentType: "TREE_PANTHEON_V2",
        publishingLevel: config?.publishingLevel,
      },
    );

    if (!article) {
      throw new Error("Article not found");
    }

    if (config?.publishingLevel === PublishingLevel.REALTIME) {
      if (
        article.previewActiveUntil &&
        article.previewActiveUntil < Date.now()
      ) {
        console.warn(
          `This preview page is no longer connected to the document (updates to the document will not be displayed until this is reconnected).
To reconnect, navigate to the document and click the 'PREVIEW' button in the Content Publisher add-on.

If you did not mean to preview this document, set the 'publishing-level' attribute on 'pcc-article' to 'PRODUCTION' to view the latest published version.`,
        );
      }

      // Subscribe to updates
      const observable = window.__PANTHEON_CLIENT.apolloClient.subscribe<{
        article: Article;
      }>({
        query: ARTICLE_UPDATE_SUBSCRIPTION,
        variables: {
          id: article.id,
          contentType: "TREE_PANTHEON_V2",
          publishingLevel: config?.publishingLevel,
        },
      });

      observable.subscribe({
        next: (update) => {
          if (!update.data) return;

          const article = update.data.article;
          renderArticleToElement(article, this, config);
        },
      });
    }

    return renderArticleToElement(article, this, config);
  }
}

export default PCCArticle;
