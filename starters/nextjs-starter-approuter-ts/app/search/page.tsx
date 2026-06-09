import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk/server";
import { Suspense } from "react";
import "react-loading-skeleton/dist/skeleton.css";
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
  // Skip pre-rendering in CI/CD environments
  if (process.env.IS_CICD === "true") {
    return <SearchResults searchResults={[]} summary={null} />;
  }

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
      <Suspense
          fallback={<SearchResults isLoading={true} searchResults={null} />}
        >
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
