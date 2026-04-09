import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk/server";
import { Suspense } from "react";
import ArticleList from "../../components/article-list";
import Layout from "../../components/layout";
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
      <Suspense>
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
