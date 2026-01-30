import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk/server";
import { Metadata } from "next";
import ArticleList from "../../../components/article-list";
import Layout from "../../../components/layout";
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

export default async function SSGISRExampleTemplate() {
  // Fetch the articles and site in parallel
  const [{ data: articles, cursor, totalCount }, site] = await Promise.all([
    PCCConvenienceFunctions.getPaginatedArticles({
      pageSize: PAGE_SIZE,
    }),
    PCCConvenienceFunctions.getSite(),
  ]);

  return (
    <Layout>
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
    </Layout>
  );
}

export function generateStaticParams() {
  // This function is empty because we're not generating any dynamic routes
  // It's included to demonstrate where you would put the logic for generating
  // static params if needed in the future
  return [];
}
