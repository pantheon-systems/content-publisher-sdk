import {
  PCCConvenienceFunctions,
  type Article,
} from "@pantheon-systems/pcc-react-sdk";
import { getArticlePathComponentsFromContentStructure } from "@pantheon-systems/pcc-react-sdk/server";
import { GetStaticPaths, GetStaticProps } from "next";
import { NextSeo } from "next-seo";
import { useSearchParams } from "next/navigation";
import { StaticArticleView } from "../../../components/article-view";
import Layout from "../../../components/layout";
import { getSeoMetadata } from "../../../lib/utils";

interface ArticlePageProps {
  article: Article;
}

export default function ArticlePage({ article }: ArticlePageProps) {
  const seoMetadata = getSeoMetadata(article);
  const searchParams = useSearchParams();

  return (
    <Layout>
      <NextSeo
        title={seoMetadata.title || undefined}
        description={seoMetadata.description}
        openGraph={seoMetadata.openGraph}
      />

      <div className="prose mx-4 mt-16 text-black sm:mx-6 md:mx-auto">
        <StaticArticleView
          article={article}
          tabId={searchParams.get("tabId")}
        />
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.uri || !Array.isArray(params?.uri) || params?.uri.length === 0) {
    return {
      notFound: true,
    };
  }

  try {
    const article = await PCCConvenienceFunctions.getArticleBySlugOrId(
      params?.uri[params?.uri.length - 1],
    );

    if (!article) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        article,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      notFound: true,
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Get all the published articles and sites in parallel
    const [publishedArticles, site] = await Promise.all([
      PCCConvenienceFunctions.getAllArticles(
        {
          publishingLevel: "PRODUCTION",
        },
        {
          publishStatus: "published",
        },
      ),
      PCCConvenienceFunctions.getSite(),
    ]);

    const pagePaths = publishedArticles.map((article) => {
      // Generate the article path from the content structure
      const articlePath = getArticlePathComponentsFromContentStructure(
        article,
        site,
      );

      const id = article.id;
      const slug = article.metadata?.slug;

      // Add the ID to the article path
      articlePath.push(id);

      // Generate both slug and id paths for each article
      const paths = [
        {
          params: {
            // Add a copy of the articlePath to the uri as we will add the slug to the end of the uri
            uri: articlePath.slice(),
          },
        },
      ];

      if (slug) {
        // Change the id to the slug
        articlePath[articlePath.length - 1] = String(slug);
        // Add the slug to the uri
        paths.push({
          params: {
            uri: articlePath,
          },
        });
      }

      return paths;
    });

    return {
      paths: pagePaths.flat(),
      fallback: "blocking",
    };
  } catch (e) {
    console.error(e);

    return {
      paths: [],
      fallback: "blocking",
    };
  }
};
