import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk/server";
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
  // Skip pre-rendering in CI/CD environments
  if (process.env.IS_CICD === "true") {
    return (
      <PaginatedArticleList
        headerText={"Pagination Example"}
        articles={[]}
        totalCount={0}
        cursor={""}
        fetcher={fetchNextPages}
        site={{} as unknown}
        additionalHeader={
          <div className="prose lg:prose-xl my-10 flex flex-col">
            <p>
              <em>
                This example uses the &quot;view more&quot; pattern to load
                additional content using client side data fetching.
              </em>
            </p>
          </div>
        }
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
    <PaginatedArticleList
      headerText="Paginated Articles"
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
