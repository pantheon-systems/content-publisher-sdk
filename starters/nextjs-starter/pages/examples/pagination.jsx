import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk";
import { NextSeo } from "next-seo";
import { ArticleGrid } from "../../components/grid";
import Layout from "../../components/layout";
import PageHeader from "../../components/page-header";
import Pagination from "../../components/pagination";
import { usePagination } from "../../hooks/usePagination";

const PAGE_SIZE = 20;

export default function ArticlesListTemplate({
  articles,
  totalCount,
  cursor,
  site,
}) {
  const {
    data: currentArticles,
    onPageChange,
    fetching,
    currentPage,
  } = usePagination({
    cursor,
    initialArticles: articles,
    pageSize: PAGE_SIZE,
  });

  return (
    <Layout>
      <NextSeo title="Articles" description="Articles" />

      <section className="max-w-screen-3xl mx-auto px-4 pt-16 sm:w-4/5 md:w-3/4 lg:w-4/5 2xl:w-3/4">
        <PageHeader title="Paginated Articles" />

        <ArticleGrid articles={currentArticles} site={site} />

        <div className="mt-4 flex flex-row items-center justify-center">
          <Pagination
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            currentPage={currentPage}
            onChange={onPageChange}
            disabled={fetching}
          />
        </div>
      </section>
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
