import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getAuthorById } from "./pcc-metadata-groups";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(input) {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isDateInputObject(v) {
  return v.msSinceEpoch != null;
}

export function getSeoMetadata(article) {
  if (article == null) {
    return {
      openGraph: {
        type: "website",
      },
    };
  }

  const tags = article.tags && article.tags.length > 0 ? article.tags : [];
  const imageProperties = [
    article.metadata?.image,
    article.metadata?.["image"],
    // Extend as needed
  ]
    .filter((url) => typeof url === "string")
    .map((url) => ({ url }));
  const description = article.metadata?.description
    ? String(article.metadata?.description)
    : "Article hosted using Pantheon Content Cloud";

  const authors = [];

  // Collecting data from metadata fields
  Object.entries(article.metadata || {}).forEach(([k, v]) => {
    const key = k.toLowerCase().trim();

    switch (key) {
      case "author": {
        if (typeof v === "string") {
          authors.push({ name: v });
        }
        break;
      }
      case "complex-author":
        if (typeof v === "string") {
          const authorName = getAuthorById(v)?.label;

          if (authorName) {
            authors.push(v);
          }
        }
        break;
    }
  });

  return {
    title: article.title,
    description,
    keywords: tags,
    authors,
    openGraph: {
      type: "website",
      title: article.title || undefined,
      images: imageProperties,
      description,
    },
  };
}
