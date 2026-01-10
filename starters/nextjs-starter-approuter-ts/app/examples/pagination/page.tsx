import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk/server";
import Layout from "../../../components/layout";
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
      <PaginatedArticleList
        headerText="Paginated Articles"
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
