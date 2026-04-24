import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk/server";
import { Suspense } from "react";
import Layout from "../../components/layout";
import SearchResults from "./search-results";

interface Props {
  searchParams: Promise<{ q?: string | null | undefined }>;
}

async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | null | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const searchResults = await PCCConvenienceFunctions.getAllArticlesWithSummary(
    {
      publishingLevel: "PRODUCTION",
    },
    resolvedSearchParams.q
      ? {
          bodyContains: resolvedSearchParams.q,
        }
      : undefined,
    true,
  );

  return (
    <SearchResults
      searchResults={searchResults.articles}
      summary={searchResults.summary}
    />
  );
}

export default function SearchPage(props: Props) {
  return (
    <Layout>
      <Suspense>
        <SearchContent searchParams={props.searchParams} />
      </Suspense>
    </Layout>
  );
}

export async function generateMetadata(props: Props) {
  const searchParams = await props.searchParams;
  return {
    title: `Search results for "${searchParams.q}"`,
    description: `Search results for "${searchParams.q}"`,
  };
}
