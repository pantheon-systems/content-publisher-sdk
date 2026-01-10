import { PublishingLevel } from "@pantheon-systems/cpub-react-sdk/server";
import { Suspense } from "react";
import Layout from "../../../components/layout";
import { SkeletonArticleView } from "../../../components/skeleton-article-view";
import { getSeoMetadata } from "../../../lib/utils";
import { ArticleView, getServersideArticle } from "./article-view";

interface ArticleViewProps {
  params: Promise<{ uri: string[] }>;
  searchParams: Promise<{
    publishingLevel: keyof typeof PublishingLevel;
    pccGrant: string | undefined;
    tabId: string | null;
    versionId: string | undefined;
  }>;
}

export default async function ArticlePage(props: ArticleViewProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <Layout>
      <div className="prose mx-4 mt-16 text-black sm:mx-6 md:mx-auto">
        <Suspense fallback={<SkeletonArticleView />}>
          <ArticleView params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </Layout>
  );
}

export async function generateMetadata(props: ArticleViewProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { article } = await getServersideArticle({ params, searchParams });

  return getSeoMetadata(article);
}
