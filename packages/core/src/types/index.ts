export interface Article {
  content: string | null;
  contentType: keyof typeof ContentType;
  id: string;
  tags: string[] | null;
  publishedDate: number | null;
  publishingLevel: keyof typeof PublishingLevel;
  source: string | null;
  sourceURL: string | null;
  title: string | null;
  updatedAt: number | null;
}

export type ArticleWithoutContent = Omit<Article, "content">;

export enum PublishingLevel {
  production = "PRODUCTION",
  realtime = "REALTIME",
  staging = "STAGING",
}

export enum ContentType {
  TEXT_MARKDOWN = "TEXT_MARKDOWN",
  TREE_PANTHEON = "TREE_PANTHEON",
}
