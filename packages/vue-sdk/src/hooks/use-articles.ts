import {
  ArticleQueryArgs,
  ArticleSearchArgs,
  buildContentType,
  convertSearchParamsToGQL,
  LIST_ARTICLES_QUERY,
} from "@pantheon-systems/cpub-sdk-core";
import { ArticleWithoutContent } from "@pantheon-systems/cpub-sdk-core/types";
import { useQuery, type UseQueryOptions } from "@vue/apollo-composable";

type ListArticlesResponse = {
  articles: ArticleWithoutContent[];
};

type Return = ReturnType<typeof useQuery<ListArticlesResponse>> & {
  articles: ArticleWithoutContent[] | undefined;
};

type ApolloQueryOptions = UseQueryOptions;

export const useArticles = (
  args?: ArticleQueryArgs,
  searchParams?: ArticleSearchArgs,
  apolloQueryOptions?: ApolloQueryOptions,
): Return => {
  const contentType = buildContentType(args?.contentType);
  const queryData = useQuery<ListArticlesResponse>(
    LIST_ARTICLES_QUERY,
    {
      variables: {
        ...args,
        ...convertSearchParamsToGQL(searchParams),
        contentType,
      },
    },
    apolloQueryOptions ?? {},
  );

  return {
    ...queryData,
    articles: queryData.result?.value?.articles,
  };
};
