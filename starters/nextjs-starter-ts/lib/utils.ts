import {
  ArticleWithoutContent,
  PantheonTree,
  TabTree,
} from "@pantheon-systems/pcc-react-sdk";
import { clsx, type ClassValue } from "clsx";
import type { Metadata } from "next";
import { twMerge } from "tailwind-merge";
import { getAuthorById } from "./pcc-metadata-groups";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface DateInputObject {
  msSinceEpoch: string;
}

function isDateInputObject(v: DateInputObject | unknown): v is DateInputObject {
  return (v as DateInputObject).msSinceEpoch != null;
}

export function getSeoMetadata(article: ArticleWithoutContent | null) {
  if (article == null) {
    return {
      openGraph: {
        type: "website",
      },
    };
  }

  const tags: string[] =
    article.tags && article.tags.length > 0 ? article.tags : [];
  const imageProperties = [
    article.metadata?.image,
    article.metadata?.["image"],
    // Extend as needed
  ]
    .filter((url): url is string => typeof url === "string")
    .map((url) => ({ url }));
  const description = article.metadata?.description
    ? String(article.metadata?.description)
    : "Article hosted using Pantheon Content Publisher";

  const authors: Metadata["authors"] = [];

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
      case "complex-author": {
        if (typeof v === "string") {
          const authorName = getAuthorById(v)?.label;

          if (authorName) {
            authors.push({ name: v });
          }
        }
        break;
      }
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

export function parseAsTabTree(
  raw:
    | string
    | PantheonTree
    | TabTree<PantheonTree | string | undefined | null>[]
    | null,
): TabTree<PantheonTree | string | undefined | null>[] | null {
  if (!raw) return null;

  // If it looks like a TabTree array, then return it.
  if (typeof raw === "object" && Array.isArray(raw) && ("children" in (raw[0] as TabTree<PantheonTree | string | undefined | null>))) return raw;

  // If it's not a string, then return null since we can't parse it anyways
  if (typeof raw !== "string") return null;

  try {
    return JSON.parse(raw) as TabTree<
      PantheonTree | string | undefined | null
    >[];
  } catch (e) {
    return null;
  }
}
