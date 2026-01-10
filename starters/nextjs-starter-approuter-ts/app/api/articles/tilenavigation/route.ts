import {
  Article,
  PCCConvenienceFunctions,
} from "@pantheon-systems/cpub-react-sdk/server";
import { NextRequest, NextResponse } from "next/server";
import { pantheonAPIOptions } from "../../pantheoncloud/[...command]/api-options";

const defaultBasePath = "/articles";
// Maximum number of articles to fetch to prevent abuse
const MAX_ARTICLES = 10;

/**
 * API Route for Tile Navigation Component
 *
 * This API route fetches article data for the TileNavigation component.
 * It takes a comma-separated list of document IDs, fetches the corresponding articles,
 * and returns minimal data needed for rendering tiles.
 *
 * Query Parameters:
 * - documentIds: Comma-separated list of document IDs (required)
 *
 * Response:
 * - 200: JSON with data property containing array of article info
 * - 400: Error if documentIds parameter is missing
 * - 500: Server error during article fetching
 *
 * Security:
 * - Limited to MAX_ARTICLES (10) to prevent abuse
 */
export async function GET(request: NextRequest) {
  // Get the document IDs as a comma separated string from the query parameters
  const url = new URL(request.url);
  const documentIds = url.searchParams.get("documentIds");

  if (!documentIds) {
    return NextResponse.json(
      { message: "documentIds parameter is required" },
      { status: 400 },
    );
  }

  // Split the document IDs into an array and limit to MAX_ARTICLES
  const docIds = documentIds.split(",").slice(0, MAX_ARTICLES);

  if (docIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  let articles: (Article | null)[] = [];

  try {
    // Fetch the article by ID from PCCConvenienceFunctions in parallel
    articles = await Promise.all(
      docIds.map(async (id) => {
        try {
          return await PCCConvenienceFunctions.getArticleBySlugOrId(id);
        } catch (error) {
          const sanitizedId = id.replace(/\n|\r/g, "");
          console.error(
            "Error fetching article with ID %s:",
            sanitizedId,
            error,
          );
          return null;
        }
      }),
    );
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch articles",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }

  // Filter out any articles that are not found
  const foundArticles = articles.filter((article) => article !== null);

  // If no articles were found, return empty array
  if (foundArticles.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Get the site from PCCConvenienceFunctions
  const site = await PCCConvenienceFunctions.getSite();

  // Map each of the article to an object with just the ID and metadata?.image
  const requiredArticleInfo = foundArticles.map((article) => ({
    id: article.id,
    image: article.metadata?.image,
    title: article.title,
    url: pantheonAPIOptions.resolvePath
      ? pantheonAPIOptions.resolvePath(article, site)
      : `${defaultBasePath}/${article.metadata?.slug ? article.metadata?.slug : article.id}`,
  }));

  // Return the articles as a JSON response
  return NextResponse.json({ data: requiredArticleInfo });
}
