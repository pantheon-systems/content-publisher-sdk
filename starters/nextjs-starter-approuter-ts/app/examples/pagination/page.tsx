import {
  PCCConvenienceFunctions,
  type Site,
} from "@pantheon-systems/cpub-react-sdk/server";
import { Suspense } from "react";
import Layout from "../../../components/layout";
import { SkeletonArticleList } from "../../../components/skeleton-article-list";
import { PAGE_SIZE } from "../../../constants";
import PaginatedArticleList from "./paginated-article-list";

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

async function PaginationContent() {
  try {
    const [{ data: articles, cursor, totalCount }, site] = await Promise.all([
      PCCConvenienceFunctions.getPaginatedArticles({
        pageSize: PAGE_SIZE,
      }),
      PCCConvenienceFunctions.getSite(),
    ]);

    return (
      <PaginatedArticleList
        headerText="Paginated Articles"
        articles={articles}
        cursor={cursor}
        totalCount={totalCount}
        fetcher={fetchNextPages}
        site={site}
      />
    );
  } catch {
    return (
      <PaginatedArticleList
        headerText={"Pagination Example"}
        articles={[]}
        totalCount={0}
        cursor={""}
        fetcher={fetchNextPages}
        site={{} as Site}
      />
    );
  }
}

export default function ArticlesListTemplate() {
  return (
    <Layout>
      <Suspense
          fallback={<SkeletonArticleList headerText="Paginated Articles" />}
        >
        <PaginationContent />
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
