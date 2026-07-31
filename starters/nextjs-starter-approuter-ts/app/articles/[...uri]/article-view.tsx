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

  if (!article) {
    return notFound();
  }

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

  let article, site;
  try {
    [article, site] = await Promise.all([
      PCCConvenienceFunctions.getArticleBySlugOrId(slugOrId, {
        publishingLevel,
        versionId,
      }),
      PCCConvenienceFunctions.getSite(),
    ]);
  } catch (e) {
    console.error(e);
    return {
      article: null,
      grant: null,
    };
  }

  if (!article) {
    return notFound();
  }

  const articlePath = getArticlePathComponentsFromContentStructure(
    article,
    site,
  );

  if (
    article.publishingLevel === "PRODUCTION" &&
    ((article.slug?.trim().length &&
      article.slug.toLowerCase() !== slugOrId?.trim().toLowerCase()) ||
      articlePath.length !== uri.length - 1 ||
      articlePath.join("/") !== uri.slice(0, -1).join("/")) &&
    pantheonAPIOptions.resolvePath != null
  ) {
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
