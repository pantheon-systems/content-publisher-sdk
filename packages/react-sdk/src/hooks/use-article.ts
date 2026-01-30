import { type QueryHookOptions } from "@apollo/client";
import { useQuery } from "@apollo/client/react/hooks/useQuery.js";
import {
  ArticleQueryArgs,
  buildContentType,
  generateArticleQuery,
  generateArticleUpdateSubscription,
} from "@pantheon-systems/cpub-sdk-core";
import { Article } from "@pantheon-systems/cpub-sdk-core/types";
import { useEffect, useMemo } from "react";

type Return = ReturnType<typeof useQuery<{ article: Article }>> & {
  article: Article | undefined;
};

type ApolloQueryOptions = Omit<
  QueryHookOptions<{ article: Article }>,
  "variables"
>;

export const useArticle = (
  id: string,
  args?: ArticleQueryArgs,
  apolloQueryOptions?: ApolloQueryOptions,
  related?: {
    site?: boolean;
  },
): Return => {
  const publishingLevel = args?.publishingLevel;
  const contentType = buildContentType(args?.contentType);
  const versionId = args?.versionId;

  const memoizedArgs = useMemo(() => {
    return {
      ...(publishingLevel && { publishingLevel }),
      ...(contentType && { contentType }),
      ...(versionId && { versionId }),
    };
  }, [publishingLevel, contentType, versionId]);

  const queryDocument = useMemo(
    () => generateArticleQuery({ withSite: related?.site }),
    [related?.site],
  );

  const subscriptionDocument = useMemo(
    () => generateArticleUpdateSubscription({ withSite: related?.site }),
    [related?.site],
  );

  const variables = useMemo(
    () => ({ id, ...memoizedArgs }),
    [id, memoizedArgs],
  );

  const { subscribeToMore, ...queryResult } = useQuery<{ article: Article }>(
    queryDocument,
    {
      ...apolloQueryOptions,
      variables,
    },
  );

  useEffect(() => {
    if (apolloQueryOptions?.skip) return;

    const unsubscribe = subscribeToMore({
      document: subscriptionDocument,
      variables,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const incoming = subscriptionData.data.article as Article;
        return { article: incoming };
      },
    });

    return () => unsubscribe();
  }, [
    subscribeToMore,
    subscriptionDocument,
    variables,
    apolloQueryOptions?.skip,
  ]);

  return {
    ...queryResult,
    subscribeToMore,
    article: queryResult.data?.article,
  };
};
