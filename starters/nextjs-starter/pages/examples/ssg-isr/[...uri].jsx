import { PCCConvenienceFunctions } from "@pantheon-systems/pcc-react-sdk";
import { NextSeo } from "next-seo";
import { StaticArticleView } from "../../../components/article-view";
import Layout from "../../../components/layout";
import { getSeoMetadata } from "../../../lib/utils";
import { getArticlePathComponentsFromContentStructure } from "@pantheon-systems/pcc-react-sdk/server";

export default function ArticlePage({ article, recommendedArticles }) {
  const seoMetadata = getSeoMetadata(article);

  return (
    <Layout>
      <NextSeo
        title={seoMetadata.title}
        description={seoMetadata.description}
        openGraph={seoMetadata.openGraph}
      />

      <div className="prose mx-4 mt-16 text-black sm:mx-6 md:mx-auto">
        <StaticArticleView article={article} />
      </div>
    </Layout>
  );
}

export const getStaticProps = async ({ params: { uri } }) => {
  if (!uri || !Array.isArray(uri) || uri.length == 0) {
    return {
      notFound: true,
    };
  }

  const article = await PCCConvenienceFunctions.getArticleBySlugOrId(uri[uri.length - 1]);

  if (!article) {
    return {
      notFound: true,
    };
  }

  const recommendedArticles =
    await PCCConvenienceFunctions.getRecommendedArticles(article.id);

  return {
    props: {
      article,
      recommendedArticles,
    },
  };
};

export const getStaticPaths = async (uri) => {
  // Get all the published articles and the site in parallel
  const [ publishedArticles, site] = await Promise.all([
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
    // Generate the article path
    const articlePath = getArticlePathComponentsFromContentStructure(article, site);

    const id = article.id;
    const slug = article.metadata.slug;

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
};
