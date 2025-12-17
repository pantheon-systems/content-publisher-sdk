import { PCCConvenienceFunctions } from "@pantheon-systems/pcc-react-sdk/server";
import ArticleList from "../../components/article-list";
import Layout from "../../components/layout";
import { PAGE_SIZE } from "../../constants";

// ISR with a short lifetime results in new content appearing pretty quickly.
// Without this setting (or something similar) this page
// renders statically with a long s-maxage
// (cache-control: s-maxage=31536000)
// With this "revalidate" value, the cache control header changes to
// cache-control: s-maxage=5, stale-while-revalidate=31535995
// See https://github.com/pantheon-systems/documentation/issues/9777
// for more detail/discussion.
export const revalidate = 5;

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

export default async function ArticlesListTemplate() {
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
        headerText="Articles"
        articles={articles}
        cursor={cursor}
        totalCount={totalCount}
        fetcher={fetchNextPages}
        site={site}
      />
    </Layout>
  );
}

export function generateMetadata() {
  return {
    title: "Decoupled Next PCC Demo",
    description: "Articles",
  };
}
