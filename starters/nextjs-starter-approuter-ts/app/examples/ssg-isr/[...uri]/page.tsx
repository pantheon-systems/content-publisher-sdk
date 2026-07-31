import {
  getArticlePathComponentsFromContentStructure,
  PCCConvenienceFunctions,
} from "@pantheon-systems/cpub-react-sdk/server";
import { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StaticArticleView } from "../../../../components/article-view";
import Layout from "../../../../components/layout";
import { SkeletonArticleView } from "../../../../components/skeleton-article-view";
import { getSeoMetadata } from "../../../../lib/utils";

interface ArticlePageProps {
  params: Promise<{ uri: string[]; tabId: string }>;
}

async function fetchArticle(slug: string) {
  "use cache";
  cacheLife({ revalidate: 21600 });
  try {
    return await PCCConvenienceFunctions.getArticleBySlugOrId(slug);
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function ArticleContent({
  params,
}: {
  params: Promise<{ uri: string[]; tabId: string }>;
}) {
  const resolvedParams = await params;
  const article = await fetchArticle(
    resolvedParams.uri[resolvedParams.uri.length - 1],
  );

  if (!article) {
    return notFound();
  }

  return (
    <StaticArticleView
      article={article}
      tabId={resolvedParams.tabId}
    />
  );
}

export default function ArticlePage(props: ArticlePageProps) {
  return (
    <Layout>
      <div className="prose mx-4 mt-16 text-black sm:mx-6 md:mx-auto">
        <Suspense fallback={<SkeletonArticleView />}>
          <ArticleContent params={props.params} />
        </Suspense>
      </div>
    </Layout>
  );
}

export async function generateMetadata(
  props: ArticlePageProps,
): Promise<Metadata> {
  try {
    const params = await props.params;
    const article = await PCCConvenienceFunctions.getArticleBySlugOrId(
      params.uri[params.uri.length - 1],
    );

    return getSeoMetadata(article);
  } catch (e) {
    console.error(e);
    return {
      title: "Article",
      description: "Article page",
    };
  }
}

export async function generateStaticParams() {
  try {
    const [publishedArticles, site] = await Promise.all([
      PCCConvenienceFunctions.getAllArticles(
        {
          publishingLevel: "PRODUCTION",
        },
        {
          publishStatus: "published",
        },
      ),
      PCCConvenienceFunctions.getSite(),
    ]);

    const params = publishedArticles.flatMap((article) => {
      const articlePath = getArticlePathComponentsFromContentStructure(
        article,
        site,
      );

      const id = article.id;
      articlePath.push(id);

      const params = [{ uri: articlePath.slice() }];
      if (article.metadata?.slug) {
        articlePath[articlePath.length - 1] = String(article.metadata.slug);
        params.push({ uri: articlePath });
      }
      return params;
    });

    if (params.length === 0) {
      return [{ uri: ["placeholder"] }];
    }

    return params;
  } catch (e) {
    console.error(e);
    return [{ uri: ["placeholder"] }];
  }
}
