/**
 * Static helper functions for articles
 */

import { ApolloError } from "..";
import { PantheonClient } from "../core/pantheon-client";
import {
  generateArticleQuery,
  generateListArticlesGQL,
  GET_RECOMMENDED_ARTICLES_QUERY,
  LIST_PAGINATED_ARTICLES_QUERY,
  LIST_PAGINATED_ARTICLES_QUERY_W_CONTENT,
} from "../lib/gql";
import {
  Article,
  ArticleSortField,
  ArticleSummaryResponse,
  ArticleWithoutContent,
  ContentType,
  PageInfo,
  PaginatedArticle,
  PublishingLevel,
  Site,
  SortOrder,
} from "../types";
import { handleApolloError } from "./errors";

export interface ArticleQueryArgs {
  contentType?: keyof typeof ContentType;
  publishingLevel?: keyof typeof PublishingLevel;
  sortBy?: keyof typeof ArticleSortField;
  sortOrder?: keyof typeof SortOrder;
  metadataFilters?: { [key: string]: unknown };
  preamble?: string;
  siteIds?: string[];
  versionId?: string;
}

export interface ArticlePaginatedQueryArgs {
  contentType?: keyof typeof ContentType;
  publishingLevel?: keyof typeof PublishingLevel;
  sortBy?: keyof typeof ArticleSortField;
  sortOrder?: keyof typeof SortOrder;
  metadataFilters?: { [key: string]: unknown };
  pageSize?: number;
  cursor?: string;
  preamble?: string;
  siteIds?: string[];
}

type PublishStatus = "published" | "unpublished";

export type ArticleSearchArgs = {
  bodyContains?: string;
  titleContains?: string;
  tags?: string[];
  publishStatus?: PublishStatus;
  siteIds?: string[];
};

type ConvertedArticleSearchArgs = {
  body?: { contains: string };
  title?: { contains: string };
  tags?: string[];
  publishStatus?: PublishStatus;
  siteIds?: string[];
};

export function convertSearchParamsToGQL(
  searchParams?: ArticleSearchArgs,
): { filter: ConvertedArticleSearchArgs } | null {
  if (!searchParams) return null;

  const convertedObject: ConvertedArticleSearchArgs = {
    body: searchParams.bodyContains
      ? {
          contains: searchParams.bodyContains,
        }
      : undefined,
    tags: searchParams.tags,
    title: searchParams.titleContains
      ? {
          contains: searchParams.titleContains,
        }
      : undefined,
    publishStatus: searchParams.publishStatus,
  };

  return Object.keys(convertedObject).length
    ? { filter: convertedObject }
    : null;
}

function fetchEmptyPage(
  total: number,
  cursor: string,
): () => Promise<PaginatedArticle> {
  return async () => ({
    data: [],
    totalCount: total,
    cursor,
    fetchNextPage: fetchEmptyPage(total, cursor),
  });
}
export async function getPaginatedArticles(
  client: PantheonClient,
  args?: ArticlePaginatedQueryArgs,
  searchParams?: ArticleSearchArgs,
  includeContent?: boolean,
): Promise<PaginatedArticle> {
  try {
    const {
      contentType: requestedContentType,
      metadataFilters,
      ...rest
    } = args || {};
    const contentType = buildContentType(requestedContentType);

    const response = await client.apolloClient.query({
      query: includeContent
        ? LIST_PAGINATED_ARTICLES_QUERY_W_CONTENT
        : LIST_PAGINATED_ARTICLES_QUERY,
      variables: {
        ...rest,
        ...(metadataFilters && {
          metadataFilters: JSON.stringify(metadataFilters),
        }),
        ...convertSearchParamsToGQL(searchParams),
        contentType,
        ...(rest.siteIds && { siteIds: rest.siteIds }),
      },
    });
    const responseData = response.data.articlesv3;
    const { articles, pageInfo } = responseData as {
      articles: ArticleWithoutContent[];
      pageInfo: PageInfo;
    };

    return {
      data: articles,
      totalCount: pageInfo.totalCount,
      cursor: pageInfo.nextCursor,
      fetchNextPage:
        pageInfo.nextCursor && articles.length > 0
          ? () =>
              getPaginatedArticles(
                client,
                { ...args, cursor: pageInfo.nextCursor },
                searchParams,
                includeContent,
              )
          : fetchEmptyPage(pageInfo.totalCount, pageInfo.nextCursor),
    };
  } catch (e) {
    handleApolloError(e);
  }
}

export async function getArticles(
  client: PantheonClient,
  args?: ArticleQueryArgs,
  searchParams?: ArticleSearchArgs,
  withContent?: boolean,
): Promise<ArticleWithoutContent[]> {
  return (
    await getArticlesWithSummary(client, args, searchParams, withContent, false)
  ).articles;
}

export async function getArticlesWithSummary(
  client: PantheonClient,
  args?: ArticleQueryArgs,
  searchParams?: ArticleSearchArgs,
  withContent?: boolean,
  withSummary?: boolean,
): Promise<ArticleSummaryResponse> {
  try {
    const {
      contentType: requestedContentType,
      metadataFilters,
      ...rest
    } = args || {};
    const contentType = buildContentType(requestedContentType);

    const query = generateListArticlesGQL({
      withContent,
      withSummary,
    });

    const response = await client.apolloClient.query({
      query,
      variables: {
        ...rest,
        ...convertSearchParamsToGQL(searchParams),
        ...(metadataFilters && {
          metadataFilters: JSON.stringify(metadataFilters),
        }),
        contentType,
      },
    });

    return response.data.articlesv3;
  } catch (e) {
    handleApolloError(e);
  }
}

export async function getArticle(
  client: PantheonClient,
  id: number | string,
  args?: ArticleQueryArgs,
  related?: {
    site?: boolean;
  },
) {
  const {
    contentType: requestedContentType,
    metadataFilters,
    ...rest
  } = args || {};
  const contentType = buildContentType(requestedContentType);

  const article = await client.apolloClient.query({
    query: generateArticleQuery({ withSite: related?.site }),
    variables: {
      id: id.toString(),
      contentType,
      ...rest,
      ...(metadataFilters && {
        metadataFilters: JSON.stringify(metadataFilters),
      }),
    },
  });

  return article.data.article as Article;
}

export async function getArticleBySlug(
  client: PantheonClient,
  slug: string,
  args?: ArticleQueryArgs,
  related?: {
    site?: boolean;
  },
) {
  const {
    contentType: requestedContentType,
    metadataFilters,
    ...rest
  } = args || {};
  const contentType = buildContentType(requestedContentType);

  const article = await client.apolloClient.query({
    query: generateArticleQuery({ withSite: related?.site }),
    variables: {
      slug,
      contentType,
      ...rest,
      ...(metadataFilters && {
        metadataFilters: JSON.stringify(metadataFilters),
      }),
    },
  });

  return article.data.article as Article;
}

export async function getArticleBySlugOrId(
  client: PantheonClient,
  slugOrId: number | string,
  args?: ArticleQueryArgs,
  related?: {
    site?: boolean;
  },
) {
  // First attempt to retrieve by slug, and fallback to by id if the matching slug
  // couldn't be found.
  try {
    const article = await getArticleBySlug(
      client,
      slugOrId.toString(),
      args,
      related,
    );

    if (article) {
      return article;
    }
  } catch {
    // Ignore any errors with retrieving by slug, because next we will try
    // to retrieve by id.
  }

  try {
    const article = await getArticle(client, slugOrId, args, related);
    return article;
  } catch (e) {
    if (
      !(e instanceof ApolloError) ||
      (e instanceof ApolloError &&
        e.message !== "No document matching this slug was found." &&
        e.message !== "No document matching this ID was found." &&
        e.graphQLErrors[0]?.message !==
          "No document matching this ID was found." &&
        e.graphQLErrors[0]?.message !==
          "No document matching this slug was found.")
    ) {
      handleApolloError(e);
    }

    return null;
  }
}

export function buildContentType(contentType?: keyof typeof ContentType) {
  if (
    !contentType ||
    contentType === ContentType.TREE_PANTHEON_V2 ||
    contentType === ContentType.TREE_PANTHEON
  ) {
    // Ask for the latest version of the tree
    return ContentType.TREE_PANTHEON_V2;
  }

  return contentType;
}

export async function getRecommendedArticles(
  client: PantheonClient,
  id: number | string,
) {
  try {
    const article = await client.apolloClient.query({
      query: GET_RECOMMENDED_ARTICLES_QUERY,
      variables: { id: id.toString() },
    });

    return article.data.recommendedArticles as Article[];
  } catch (e) {
    handleApolloError(e);
  }
}

interface ContentStructureChild {
  id: string;
  name: string;
  type: "category" | "article";
  children?: ContentStructureChild[];
}

function doesChildContainArticle(
  child: ContentStructureChild,
  article: Partial<Article> & Pick<Article, "id">,
) {
  const categoryTree: string[] = [];
  let contains = false;

  // If the child is an article, check if it matches the article id
  if (child.type === "article") {
    if (child.id === article.id) {
      contains = true;
    }

    return { contains, categoryTree };
  }

  // Iterate over the category and its children
  for (const childOfChild of child.children || []) {
    // If the child is another category, we need to iterate over its children
    if (childOfChild.type === "category") {
      const result = doesChildContainArticle(childOfChild, article);
      if (result.contains) {
        // Add the current category name to the category tree
        categoryTree.push(child.name);
        // Append the result of the recursive call
        categoryTree.push(...result.categoryTree);
        contains = true;
        // Break out of the loop
        break;
      }
    } else {
      // If the child is an article, check if it matches the article id
      if (childOfChild.id === article.id) {
        contains = true;
        // If it does, append the result's category tree to the current category tree
        categoryTree.push(child.name);
        // Break out of the loop
        break;
      }
    }
  }

  return { contains, categoryTree };
}

/**
 * Get the path components for an article from the site's content structure
 * @param article - The article to get the path for
 * @param site - The site being used
 * @returns The path components for the article
 */
export function getArticlePathComponentsFromContentStructure(
  article: Partial<Article> & Pick<Article, "id">,
  site: Site,
) {
  const defaultPath: string[] = [];
  // If the site is not defined or the content structure is not defined or if the active key is not defined, return the default path
  if (!site || !site.contentStructure || !site.contentStructure.active) {
    return defaultPath;
  }
  // If the active key is present, it will be an array of objects. Its structure is as follows:
  // {
  //   "id": "string",
  //   "name": "string",
  //   "type": "string"
  //   "children": [
  //     {
  //       "id": "string",
  //       "name": "string",
  //       "type": "string"
  //     }
  //   ]
  // }
  // type will be one of the following: "category" or "article"
  // We need to find the article object that contains the articleId
  const active = site.contentStructure.active;
  if (typeof active !== "object" || !Array.isArray(active) || !active.length) {
    return defaultPath;
  }
  // Iterate over the active array
  for (const category of active) {
    // The categories can be nested, so we need to find the relevant list of categories that contain the articleId
    // We need to iterate over all the categories, do the same for all its children. Keep doing this until we find the articleId
    const { contains, categoryTree } = doesChildContainArticle(
      category,
      article,
    );
    if (!contains) {
      continue;
    }
    // If the item is found, return the path as a normalized path
    if (categoryTree && categoryTree.length > 0) {
      // normalise the name of each category in the categoryTree
      const normalisedCategoryTree = categoryTree.map((category) =>
        category
          .replace(/ /g, "-")
          .replace(/[^a-zA-Z0-9-]/g, "")
          .toLowerCase(),
      );
      // Return it
      return normalisedCategoryTree;
    }
  }

  return defaultPath;
}

function getRelevantCategoriesForPath(articlePath: string[], maxDepth: number) {
  if (maxDepth === 0) {
    return [];
  }
  // If the maxDepth is -1, return all the categories
  if (maxDepth === -1) {
    return articlePath;
  }
  // If not, return the last maxDepth categories or all the categories if there are less than maxDepth
  return articlePath.slice(-maxDepth);
}

/**
 * Get the URL for an article from the site's content structure
 * @param article - The article to get the URL for
 * @param site - The site being used
 * @param basePath - The base path to use for the URL
 * @param maxDepth - The maximum depth to include in the URL. If it is -1, it will include all the categories. If it is 0, it will only include the article. If it is 1, it will include the article's slug or id and its immediate parent category and so on.
 * @returns The URL for the article
 */
export function getArticleURLFromSite(
  article: Partial<Article> & Pick<Article, "id">,
  site: Site | undefined,
  basePath = "/articles",
  maxDepth = -1,
) {
  if (!site) {
    // If the site is undefined, return the base path - basePath/<slug-or-id>
    return `${basePath}/${article.slug || article.id}`;
  }
  // Get the article path
  const articlePath = getArticlePathComponentsFromContentStructure(
    article,
    site,
  );
  // Get the relevant categories for the path
  const relevantArticlePath = getRelevantCategoriesForPath(
    articlePath,
    maxDepth,
  );

  const identifier =
    article.publishingLevel === "PRODUCTION"
      ? article.slug || article.id
      : article.id;

  // Add the basePath before the articlePath and the article slug or id at the end
  if (relevantArticlePath.length > 0) {
    return `${basePath}/${relevantArticlePath.join("/")}/${identifier}`;
  }

  // If the maxDepth is 0 or the articlePath is empty, return the article's slug or id
  return `${basePath}/${identifier}`;
}

export function getArticleURLFromSiteWithOptions(options: {
  // Base path to use for the URL. So if the base path is /articles, the URL for a doc will be /articles/<content-structure-path>/<slug-or-id>
  basePath: string;
  // Maximum depth to include in the URL. If it is -1, it will include all the categories. If it is 0, it will only include the article. If it is 1, it will include the article's slug or id and its immediate parent category and so on.
  maxDepth: number;
}) {
  return (
    article: Partial<Article> & Pick<Article, "id">,
    site: Site | undefined,
  ) => getArticleURLFromSite(article, site, options.basePath, options.maxDepth);
}
