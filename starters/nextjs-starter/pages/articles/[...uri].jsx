import {
  PantheonProvider,
  PCCConvenienceFunctions,
} from "@pantheon-systems/cpub-react-sdk";
import { getArticlePathComponentsFromContentStructure } from "@pantheon-systems/cpub-react-sdk/server";
import { generateNextSeo } from "next-seo/pages";
import Head from "next/head";
import queryString from "query-string";
import ArticleView from "../../components/article-view";
import Layout from "../../components/layout";
import { getSeoMetadata } from "../../lib/utils";
import { pantheonAPIOptions } from "../api/pantheoncloud/[...command]";

export default function ArticlePage({
  article,
  grant,
  publishingLevel,
  versionId,
}) {
  const seoMetadata = getSeoMetadata(article);

  return (
    <PantheonProvider
      client={PCCConvenienceFunctions.buildPantheonClient({
        isClientSide: true,
        pccGrant: grant,
      })}
    >
      <Layout>
        <Head>
          {generateNextSeo({
            title: seoMetadata.title,
            description: seoMetadata.description,
            openGraph: seoMetadata.openGraph,
          })}
        </Head>

        <div className="prose mx-4 mt-16 text-black sm:mx-6 md:mx-auto">
          <ArticleView
            article={article}
            publishingLevel={publishingLevel}
            versionId={versionId}
          />
        </div>
      </Layout>
    </PantheonProvider>
  );
}

export async function getServerSideProps({
  req: { cookies },
  query: { uri, publishingLevel, pccGrant, versionId, ...query },
}) {
  const slugOrId = uri[uri.length - 1];
  const grant = pccGrant || cookies["PCC-GRANT"] || null;

  // Fetch the article and site in parallel
  const [article, site] = await Promise.all([
    PCCConvenienceFunctions.getArticleBySlugOrId(slugOrId, {
      publishingLevel,
      versionId,
    }),
    PCCConvenienceFunctions.getSite(),
  ]);

  // If the article is not found, return a 404
  if (!article) {
    return {
      notFound: true,
    };
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
      // Check if the article (with all the components together) path is not the same as the uri
      articlePath.join("/") !== uri.slice(0, -1).join("/")) &&
    // Check if resolvePath in pantheon API options is not null
    pantheonAPIOptions.resolvePath != null
  ) {
    // If the article was accessed by the id rather than the slug
    // or the article path is not the same as the uri - then redirect to the canonical
    // link (mostly for SEO purposes than anything else).
    return {
      redirect: {
        destination: queryString.stringifyUrl({
          url: pantheonAPIOptions.resolvePath(article, site),
          query: { publishingLevel, ...query },
        }),
        permanent: false,
      },
    };
  }

  return {
    props: {
      article,
      grant: grant || null,
      publishingLevel: publishingLevel || null,
      versionId: versionId || null,
      recommendedArticles: await PCCConvenienceFunctions.getRecommendedArticles(
        article.id,
      ),
    },
  };
}
