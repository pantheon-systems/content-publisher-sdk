import {
  ARTICLE_UPDATE_SUBSCRIPTION,
  ArticleQueryArgs,
  buildContentType,
  GET_ARTICLE_QUERY,
} from "@pantheon-systems/pcc-sdk-core";
import { Article } from "@pantheon-systems/pcc-sdk-core/types";
import { useQuery, type UseQueryOptions } from "@vue/apollo-composable";
import { Ref, ref } from "vue-demi";

type GetArticleQueryResult = {
  article: Article | undefined;
};

type Return = ReturnType<typeof useQuery<GetArticleQueryResult>> & {
  article: Ref<Article | undefined>;
};

type ApolloQueryOptions = UseQueryOptions;

export const useArticle = (
  id: string,
  args?: ArticleQueryArgs,
  apolloQueryOptions?: ApolloQueryOptions,
): Return => {
  const contentType = buildContentType(args?.contentType);
  const { subscribeToMore, ...queryData } = useQuery<GetArticleQueryResult>(
    GET_ARTICLE_QUERY,
    {
      id,
      ...args,
      contentType,
    },
    apolloQueryOptions ?? {},
  );

  const article = ref(queryData.result?.value?.article);

  if (apolloQueryOptions?.enabled !== false) {
    subscribeToMore({
      document: ARTICLE_UPDATE_SUBSCRIPTION,
      variables: { id, ...args, contentType },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;

        article.value = subscriptionData.data.article;

        return subscriptionData.data;
      },
    });
  }

  return {
    ...queryData,
    subscribeToMore,
    article,
  };
};
