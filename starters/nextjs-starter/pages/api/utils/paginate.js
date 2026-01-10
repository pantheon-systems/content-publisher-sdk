import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk";

export default async function handler(req, res) {
  let cursor;
  if (Array.isArray(req.query.cursor)) cursor = req.query.cursor[0];
  else cursor = req.query.cursor;

  let pageSize;
  try {
    pageSize = parseInt(req.query.pageSize);
  } catch {
    return res.status(400).json("Invalid pageSize");
  }

  let author;
  if (Array.isArray(req.query.author)) author = req.query.author[0];
  else author = req.query.author;

  if (!pageSize || !cursor)
    return res.status(400).json("Invalid pageSize or cursor");

  const { data, cursor: newCursor } =
    await PCCConvenienceFunctions.getPaginatedArticles({
      pageSize,
      ...(cursor && { cursor }),
      ...(author && { metadataFilters: { author } }),
    });

  return res.status(200).json({ data, newCursor });
}
