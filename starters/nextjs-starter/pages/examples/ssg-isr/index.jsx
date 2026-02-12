import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk";
import Head from "next/head";
import { generateNextSeo } from "next-seo/pages";
import { ArticleGrid } from "../../../components/grid";
import Layout from "../../../components/layout";
import PageHeader from "../../../components/page-header";
import Pagination from "../../../components/pagination";
import { PAGE_SIZE } from "../../../constants";
import { usePagination } from "../../../hooks/usePagination";

export default function SSGISRExampleTemplate({
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
      <Head>
        {generateNextSeo({
          title: "SSG and ISR Example",
          description: "Example of using SSG and ISR",
        })}
      </Head>
      <section className="max-w-screen-3xl mx-auto px-4 pt-16 sm:w-4/5 md:w-3/4 lg:w-4/5 2xl:w-3/4">
        <PageHeader title="SSG and ISR Example" />
        <div className="prose lg:prose-xl my-10 flex flex-col">
          <p>
            <em>
              By default, this starter kit is optimized for SSR and Edge Caching
              on Pantheon. This example instead uses Incremental Static
              Regeneration and is provided as a reference for cases where
              Next.js static generation options would be beneficial.
            </em>
          </p>
        </div>

        <ArticleGrid
          articles={currentArticles}
          basePath={"/examples/ssg-isr"}
          site={site}
        />
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

export async function getStaticProps() {
  // Fetch the articles and site in parallel
  const [{ data: articles, totalCount, cursor }, site] = await Promise.all([
    PCCConvenienceFunctions.getPaginatedArticles({
      pageSize: PAGE_SIZE,
    }),
    PCCConvenienceFunctions.getSite(),
  ]);

  return {
    props: {
      articles,
      totalCount,
      cursor,
      site,
    },
    revalidate: 60,
  };
}
