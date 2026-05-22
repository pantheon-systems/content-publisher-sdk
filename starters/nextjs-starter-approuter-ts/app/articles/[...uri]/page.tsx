import {
  PCCConvenienceFunctions,
  PublishingLevel,
} from "@pantheon-systems/cpub-react-sdk/server";
import { Suspense } from "react";
import Layout from "../../../components/layout";
import { SkeletonArticleView } from "../../../components/skeleton-article-view";
import { getSeoMetadata } from "../../../lib/utils";
import { ArticleView } from "./article-view";

interface ArticleViewProps {
  params: Promise<{ uri: string[] }>;
  searchParams: Promise<{
    publishingLevel: keyof typeof PublishingLevel;
    pccGrant: string | undefined;
    tabId: string | null;
    versionId: string | undefined;
  }>;
}

async function ArticleContent({
  params,
  searchParams,
}: {
  params: Promise<{ uri: string[] }>;
  searchParams: Promise<{
    publishingLevel: keyof typeof PublishingLevel;
    pccGrant: string | undefined;
    tabId: string | null;
    versionId: string | undefined;
  }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  return (
    <ArticleView params={resolvedParams} searchParams={resolvedSearchParams} />
  );
}

export default function ArticlePage(props: ArticleViewProps) {
  return (
    <Layout>
      <div className="prose mx-4 mt-16 text-black sm:mx-6 md:mx-auto">
        <Suspense fallback={<SkeletonArticleView />}>
          <ArticleContent
            params={props.params}
            searchParams={props.searchParams}
          />
        </Suspense>
      </div>
    </Layout>
  );
}

export async function generateMetadata(props: ArticleViewProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const slugOrId = params.uri[params.uri.length - 1];
  const article = await PCCConvenienceFunctions.getArticleBySlugOrId(slugOrId, {
    publishingLevel: searchParams.publishingLevel,
    versionId: searchParams.versionId,
  });

  return getSeoMetadata(article);
}
