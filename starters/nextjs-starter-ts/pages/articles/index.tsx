import {
  Article,
  PCCConvenienceFunctions,
  Site,
} from "@pantheon-systems/cpub-react-sdk";
import Head from "next/head";
import { generateNextSeo } from "next-seo/pages";
import queryString from "query-string";
import ArticleList from "../../components/article-list";
import Layout from "../../components/layout";
import { PAGE_SIZE } from "../../constants";

async function fetchNextPages(cursor?: string | null | undefined) {
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

interface Props {
  articles: Article[];
  totalCount: number;
  cursor: string;
  site: Site;
}

export default function ArticlesListTemplate({
  articles,
  totalCount,
  cursor,
  site,
}: Props) {
  return (
    <Layout>
      <Head>{generateNextSeo({ title: "Articles", description: "Articles" })}</Head>

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
      cursor,
      totalCount,
      site,
    },
  };
}
