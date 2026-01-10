import {
  getArticlePathComponentsFromContentStructure,
  PCCConvenienceFunctions,
  type PublishingLevel,
} from "@pantheon-systems/cpub-react-sdk/server";
import { cookies } from "next/headers";
import { notFound, redirect, RedirectType } from "next/navigation";
import queryString from "query-string";
import { pantheonAPIOptions } from "../../api/pantheoncloud/[...command]/api-options";
import { ClientsideArticleView } from "./clientside-articleview";

export interface ArticleViewProps {
  params: { uri: string[] };
  searchParams: {
    publishingLevel: keyof typeof PublishingLevel;
    pccGrant: string | undefined;
    tabId: string | null;
    versionId: string | undefined;
  };
}

export const ArticleView = async ({
  params,
  searchParams,
}: ArticleViewProps) => {
  const { article, grant } = await getServersideArticle({
    params,
    searchParams,
  });

  return (
    <ClientsideArticleView
      article={article}
      grant={grant || undefined}
      publishingLevel={searchParams.publishingLevel}
      versionId={searchParams.versionId || null}
    />
  );
};

interface GetServersideArticleProps {
  params: { uri: string[] };
  searchParams: {
    publishingLevel: keyof typeof PublishingLevel;
    pccGrant: string | undefined;
    tabId: string | null;
    versionId: string | undefined;
  };
}

export async function getServersideArticle({
  params,
  searchParams,
}: GetServersideArticleProps) {
  const { uri } = params;
  const { publishingLevel, pccGrant, versionId, ...query } = searchParams;

  const slugOrId = uri[uri.length - 1];
  const grant = pccGrant || (await cookies()).get("PCC-GRANT")?.value || null;

  // Fetch the article and site in parallel
  const [article, site] = await Promise.all([
    PCCConvenienceFunctions.getArticleBySlugOrId(slugOrId, {
      publishingLevel,
      versionId,
    }),
    PCCConvenienceFunctions.getSite(),
  ]);

  if (!article) {
    return notFound();
  }

  // Get the article path from the content structure
  const articlePath = getArticlePathComponentsFromContentStructure(
    article,
    site,
  );

  if (
    // Only redirect if this is a published article
    article.publishingLevel === "PRODUCTION" &&
    // Check if the article has a slug
    ((article.slug?.trim().length &&
      // Check if the slug is not the same as the slugOrId
      article.slug.toLowerCase() !== slugOrId?.trim().toLowerCase()) ||
      // Check if the article path is not the same as the uri
      articlePath.length !== uri.length - 1 ||
      // Check if the article path (with all the components together) is not the same as the uri
      articlePath.join("/") !== uri.slice(0, -1).join("/")) &&
    // Check if resolvePath in pantheon API options is not null
    pantheonAPIOptions.resolvePath != null
  ) {
    // If the article was accessed by the id rather than the slug - then redirect to the canonical
    // link (mostly for SEO purposes than anything else).
    // If the article path is not the same as the uri ie. if it is being accessed by a path without the content structure
    // then redirect to the canonical link.
    redirect(
      queryString.stringifyUrl({
        url: pantheonAPIOptions.resolvePath(article, site),
        query: { publishingLevel, ...query },
      }),
      RedirectType.replace,
    );
  }

  return {
    article,
    grant,
    publishingLevel,
    versionId,
    site,
  };
}
