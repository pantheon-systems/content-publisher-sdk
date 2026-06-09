import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk/server";
import { Metadata } from "next";
import { Suspense } from "react";
import ArticleList from "../../../components/article-list";
import Layout from "../../../components/layout";
import { SkeletonArticleList } from "../../../components/skeleton-article-list";
import { PAGE_SIZE } from "../../../constants";

export const metadata: Metadata = {
  title: "SSG and ISR Example",
  description: "Example of using SSG and ISR",
};

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

async function SSGISRContent() {
  // Skip pre-rendering in CI/CD environments
  if (process.env.IS_CICD === "true") {
    return (
      <ArticleList
        headerText={"SSG and ISR Example"}
        articles={[]}
        totalCount={0}
        cursor={""}
        fetcher={fetchNextPages}
        site={{} as unknown}
        additionalHeader={
          <div className="prose lg:prose-xl my-10 flex flex-col">
            <p>
              <em>
                By default, this starter kit is optimized for SSR and Edge
                Caching on Pantheon. This example instead uses Incremental
                Static Regeneration and is provided as a reference for cases
                where Next.js static generation options would be beneficial.
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
    <ArticleList
      headerText={"SSG and ISR Example"}
      articles={articles}
      totalCount={totalCount}
      cursor={cursor}
      fetcher={fetchNextPages}
      site={site}
      additionalHeader={
        <div className="prose lg:prose-xl my-10 flex flex-col">
          <p>
            <em>
              By default, this starter kit is optimized for SSR and Edge
              Caching on Pantheon. This example instead uses Incremental
              Static Regeneration and is provided as a reference for cases
              where Next.js static generation options would be beneficial.
            </em>
          </p>
        </div>
      }
    />
  );
}

export default function SSGISRExampleTemplate() {
  return (
    <Layout>
      <Suspense
          fallback={
            <SkeletonArticleList headerText="SSG and ISR Example" />
          }
        >
        <SSGISRContent />
      </Suspense>
    </Layout>
  );
}

export function generateStaticParams() {
  // This function is empty because we're not generating any dynamic routes
  // It's included to demonstrate where you would put the logic for generating
  // static params if needed in the future
  return [];
}
