import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk/server";
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
import Layout from "../../../components/layout";
import { PAGE_SIZE } from "../../../constants";

function fetchNextPages(author?: string | null | undefined) {
  return async (cursor?: string | null | undefined) => {
    "use server";
    const { data, cursor: newCursor } =
      await PCCConvenienceFunctions.getPaginatedArticles({
        pageSize: PAGE_SIZE,
        metadataFilters:
          author == null
            ? undefined
            : {
                author,
              },
        cursor: cursor || undefined,
      });

    return {
      data,
      newCursor,
    };
  };
}

export default async function ArticlesListTemplate(props: {
  params: Promise<{ author: string }>;
}) {
  const params = await props.params;
  const author = params.author ? decodeURIComponent(params.author) : undefined;

  const [site, { data: articles, cursor, totalCount }] = await Promise.all([
    PCCConvenienceFunctions.getSite(),
    PCCConvenienceFunctions.getPaginatedArticles({
      pageSize: PAGE_SIZE,
      metadataFilters: {
        author,
      },
    }),
  ]);

  if (totalCount === 0) {
    return (
      <Layout>
        <section className="max-w-screen-3xl mx-auto px-4 pt-16 sm:w-4/5 md:w-3/4 lg:w-4/5 2xl:w-3/4">
          <div>Could not find any articles by {author}</div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
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

export function generateMetadata() {
  return {
    title: "Decoupled Next PCC Demo",
    description: "Articles by Author",
  };
}
