import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { q } = req.query;

  if (!q || typeof q !== "string") {
    return res.status(400).json({ message: "Missing or invalid search query" });
  }

  try {
    const { articles, summary } =
      await PCCConvenienceFunctions.getAllArticlesWithSummary(
        {
          publishingLevel: "PRODUCTION",
        },
        {
          bodyContains: q,
        },
        true,
      );

    res.status(200).json({
      searchResults: articles,
      summary,
      searchString: q,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).send("Internal Server Error");
  }
}
