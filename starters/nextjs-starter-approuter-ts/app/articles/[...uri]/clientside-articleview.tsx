"use client";

import {
  Article,
  PantheonProvider,
  PCCConvenienceFunctions,
  updateConfig,
  type PublishingLevel,
} from "@pantheon-systems/cpub-react-sdk";
import ArticleView from "../../../components/article-view";

updateConfig({
  pccHost: (process.env.PCC_HOST || process.env.NEXT_PUBLIC_PCC_HOST) as string,
  siteId: (process.env.PCC_SITE_ID ||
    process.env.NEXT_PUBLIC_PCC_SITE_ID) as string,
});

export const ClientsideArticleView = ({
  article,
  grant,
  publishingLevel,
  versionId,
}: {
  article: Article;
  grant?: string | undefined;
  publishingLevel: keyof typeof PublishingLevel;
  versionId: string | null;
}) => {
  return (
    <PantheonProvider
      client={PCCConvenienceFunctions.buildPantheonClient({
        isClientSide: true,
        pccGrant: grant,
      })}
    >
      <ArticleView
        article={article}
        publishingLevel={publishingLevel}
        versionId={versionId}
      />
    </PantheonProvider>
  );
};
