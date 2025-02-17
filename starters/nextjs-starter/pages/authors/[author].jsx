import { PCCConvenienceFunctions } from "@pantheon-systems/pcc-react-sdk";
import { NextSeo } from "next-seo";
import Image from "next/image";
import {
  FaFacebookSquare,
  FaInstagramSquare,
  FaLinkedin,
} from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { PiMediumLogoFill } from "react-icons/pi";
import ArticleList from "../../../components/article-list";
import { PAGE_SIZE } from "../../../constants";
import Layout from "../../components/layout";

function fetchNextPages() {
  return async (cursor) => {
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
}) {
  return (
    <Layout>
      <NextSeo title="Articles" description="Articles" />

      <ArticleList
        articles={articles}
        cursor={cursor}
        totalCount={totalCount}
        fetcher={fetchNextPages(author)}
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

export async function getServerSideProps({ query: { author } }) {
  const {
    data: articles,
    totalCount,
    cursor,
  } = await PCCConvenienceFunctions.getPaginatedArticles({
    pageSize: PAGE_SIZE,
    metadataFilters: {
      author,
    },
  });

  return {
    props: {
      articles,
      cursor,
      totalCount,
      author,
    },
  };
}
