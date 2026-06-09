import {
  PCCConvenienceFunctions,
  type Site,
} from "@pantheon-systems/cpub-react-sdk/server";
import { Suspense } from "react";
import ArticleList from "../../components/article-list";
import Layout from "../../components/layout";
import { SkeletonArticleList } from "../../components/skeleton-article-list";
import { PAGE_SIZE } from "../../constants";

async function fetchNextPages(cursor?: string | null | undefined) {
  "use server";
  const { data, cursor: newCursor } =
    await PCCConvenienceFunctions.getPaginatedArticles({
      pageSize: PAGE_SIZE,
      cursor: cursor || undefined,
    });
  return {
    data,
    newCursor,
  };
}

async function ArticlesContent() {
  // Skip pre-rendering in CI/CD environments
  if (process.env.IS_CICD === "true") {
    return (
      <ArticleList
        headerText={"All Articles"}
        articles={[]}
        totalCount={0}
        cursor={""}
        fetcher={fetchNextPages}
        site={{} as Site}
      />
    );
  }

  // Fetch the articles and site in parallel
  const [{ data: articles, cursor, totalCount }, site] = await Promise.all([
    PCCConvenienceFunctions.getPaginatedArticles({
      pageSize: PAGE_SIZE,
    }),
    PCCConvenienceFunctions.getSite(),
  ]);

  return (
    <ArticleList
      headerText="Articles"
      articles={articles}
      cursor={cursor}
      totalCount={totalCount}
      fetcher={fetchNextPages}
      site={site}
    />
  );
}

export default function ArticlesListTemplate() {
  return (
    <Layout>
      <Suspense fallback={<SkeletonArticleList headerText="Articles" />}>
        <ArticlesContent />
      </Suspense>
    </Layout>
  );
}

export function generateMetadata() {
  return {
    title: "Decoupled Next PCC Demo",
    description: "Articles",
  };
}
