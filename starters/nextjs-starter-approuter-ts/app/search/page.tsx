import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk/server";
import Layout from "../../components/layout";
import SearchResults from "./search-results";

interface Props {
  searchParams: Promise<{ q?: string | null | undefined }>;
}

export default async function SearchPage(props: Props) {
  const searchParams = await props.searchParams;
  const searchResults = await PCCConvenienceFunctions.getAllArticlesWithSummary(
    {
      publishingLevel: "PRODUCTION",
    },
    searchParams.q
      ? {
          bodyContains: searchParams.q,
        }
      : undefined,
    true,
  );

  return (
    <Layout>
      <SearchResults
        searchResults={searchResults.articles}
        summary={searchResults.summary}
      />
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
