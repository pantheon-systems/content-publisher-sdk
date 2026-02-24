import {
  Article,
  PCCConvenienceFunctions,
  Site,
} from "@pantheon-systems/cpub-react-sdk";
import Head from "next/head";
import { generateNextSeo } from "next-seo/pages";
import Image from "next/image";
import queryString from "query-string";
import {
  FaFacebookSquare,
  FaInstagramSquare,
  FaLinkedin,
} from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { PiMediumLogoFill } from "react-icons/pi";
import ArticleList from "../../components/article-list";
import Layout from "../../components/layout";
import { PAGE_SIZE } from "../../constants";

function fetchNextPages(author?: string | null | undefined) {
  return async (cursor?: string | null | undefined) => {
    const url = queryString.stringifyUrl({
      url: "/api/utils/paginate",
      query: {
        pageSize: PAGE_SIZE,
        cursor: cursor,
        author,
      },
    });

    const response = await fetch(url);
    const { data, cursor: newCursor } = await response.json();
    return {
      data,
      newCursor,
    };
  };
}

export default function ArticlesListTemplate({
  articles,
  totalCount,
  cursor,
  author,
  site,
}: {
  articles: Article[];
  totalCount: number;
  cursor: string;
  author?: string;
  site: Site;
}) {
  return (
    <Layout>
      <Head>{generateNextSeo({ title: "Articles", description: "Articles" })}</Head>

      <ArticleList
        articles={articles}
        cursor={cursor}
        totalCount={totalCount}
        fetcher={fetchNextPages(author)}
        site={site}
        additionalHeader={
          <div
            className="border-base-300 mb-14 border-b-[1px] pb-7"
            data-testid="author-header"
          >
            <div className="flex flex-row gap-x-6">
              <div>
                <Image
                  className="m-0 rounded-full"
                  src="/images/no-avatar.png"
                  width={90}
                  height={90}
                  alt={`Avatar of ${author}`}
                />
              </div>
              <div className="flex flex-col justify-between">
                <h1 className="text-5xl font-bold capitalize">{author}</h1>
                <div>A short line about the author</div>
              </div>
            </div>
            <div className="my-8 flex flex-row gap-x-3">
              <FaLinkedin className="h-7 w-7" fill="#404040" />
              <FaSquareXTwitter className="h-7 w-7" fill="#404040" />
              <PiMediumLogoFill className="h-7 w-7" fill="#404040" />
              <FaFacebookSquare className="h-7 w-7" fill="#404040" />
              <FaInstagramSquare className="h-7 w-7" fill="#404040" />
              <MdEmail className="h-7 w-7" fill="#404040" />
            </div>
            <div>
              {author} is a passionate content writer with a flair for turning
              ideas into engaging stories. When she’s not writing, Jane enjoys
              cozy afternoons with a good book, exploring new coffee spots, and
              finding inspiration in everyday moments.
            </div>
          </div>
        }
      />
    </Layout>
  );
}

export async function getServerSideProps({
  query: { author },
}: {
  query: { author: string };
}) {
  // Fetch the articles and site in parallel
  const [{ data: articles, totalCount, cursor }, site] = await Promise.all([
    PCCConvenienceFunctions.getPaginatedArticles({
      pageSize: PAGE_SIZE,
      metadataFilters: {
        author,
      },
    }),
    PCCConvenienceFunctions.getSite(),
  ]);

  return {
    props: {
      articles,
      cursor,
      totalCount,
      author,
      site,
    },
  };
}
