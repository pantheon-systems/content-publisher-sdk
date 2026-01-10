import {
  Article,
  PCCConvenienceFunctions,
} from "@pantheon-systems/cpub-react-sdk";
import { NextApiRequest, NextApiResponse } from "next";
import { pantheonAPIOptions } from "../pantheoncloud/[...command]";

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
 * - 405: Method not allowed (only GET supported)
 * - 500: Server error during article fetching
 *
 * Security:
 * - Limited to MAX_ARTICLES to prevent abuse
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Check if it is a GET request
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Get the document IDs as a comma separated string from the query parameters
  const documentIds = req.query.documentIds as string;

  if (!documentIds) {
    return res
      .status(400)
      .json({ message: "documentIds parameter is required" });
  }

  // Split the document IDs into an array and limit to MAX_ARTICLES
  const docIds = documentIds.split(",").slice(0, MAX_ARTICLES);

  if (docIds.length === 0) {
    return res.status(200).json({ data: [] });
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
    return res.status(500).json({
      message: "Failed to fetch articles",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Filter out any articles that are not found
  const foundArticles = articles.filter((article) => article !== null);

  // If no articles were found, return empty array
  if (foundArticles.length === 0) {
    return res.status(200).json({ data: [] });
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
  return res.status(200).json({ data: requiredArticleInfo });
}
