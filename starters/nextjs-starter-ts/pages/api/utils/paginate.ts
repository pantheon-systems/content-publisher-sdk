import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  let cursor: string | undefined;
  if (Array.isArray(req.query.cursor)) cursor = req.query.cursor[0];
  else cursor = req.query.cursor;

  let pageSize: number;
  try {
    pageSize = parseInt(req.query.pageSize as string);
  } catch {
    return res.status(400).json("Invalid pageSize");
  }

  let author: string | null | undefined;
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
