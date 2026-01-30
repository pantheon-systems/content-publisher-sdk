import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk";
import { NextSeo } from "next-seo";
import queryString from "query-string";
import ArticleList from "../../components/article-list";
import Layout from "../../components/layout";
import { PAGE_SIZE } from "../../constants";

async function fetchNextPages(cursor) {
  const url = queryString.stringifyUrl({
    url: "/api/utils/paginate",
    query: {
      pageSize: PAGE_SIZE,
      cursor: cursor,
    },
  });

  const response = await fetch(url);
  const { data, cursor: newCursor } = await response.json();
  return {
    data,
    newCursor,
  };
}

export default function ArticlesListTemplate({ articles, totalCount, cursor }) {
  return (
    <Layout>
      <NextSeo title="Articles" description="Articles" />

      <ArticleList
        headerText="Articles"
        articles={articles}
        cursor={cursor}
        totalCount={totalCount}
        fetcher={fetchNextPages}
      />
    </Layout>
  );
}

export async function getServerSideProps() {
  // Fetch the site and articles in parallel
  const [site, { data: articles, totalCount, cursor }] = await Promise.all([
    PCCConvenienceFunctions.getSite(),
    PCCConvenienceFunctions.getPaginatedArticles({
      pageSize: PAGE_SIZE,
    }),
  ]);

  return {
    props: {
      articles,
      totalCount,
      cursor,
      site,
    },
  };
}
