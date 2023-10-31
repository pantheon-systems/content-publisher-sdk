import {
  ArticleQueryArgs,
  ArticleSearchArgs,
  buildContentType,
  convertSearchParamsToGQL,
  LIST_ARTICLES_QUERY,
} from "@pantheon-systems/pcc-sdk-core";
import { ArticleWithoutContent } from "@pantheon-systems/pcc-sdk-core/types";
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
      variables: Object.assign(
        {},
        { ...args, contentType },
        convertSearchParamsToGQL(searchParams),
      ),
    },
    apolloQueryOptions ?? {},
  );

  return {
    ...queryData,
    articles: queryData.result?.value?.articles,
  };
};
