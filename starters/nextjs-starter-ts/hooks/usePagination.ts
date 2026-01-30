import {
  ArticleWithoutContent,
  PaginatedArticle,
} from "@pantheon-systems/cpub-react-sdk";
import queryString from "query-string";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";

interface Props {
  cursor?: string;
  pageSize: number;
  initialArticles?: PaginatedArticle[] | ArticleWithoutContent[];
  author?: string;
}

export function usePagination({
  cursor,
  initialArticles,
  pageSize,
  author,
}: Props) {
  const [articlePages, setArticlePages] = useState(
    initialArticles ? [initialArticles] : [],
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [currentCursor, setCurrentCursor] = useState(cursor);

  const fetcher = useCallback(
    async (key: string) => {
      const pageNumber = Number(key);
      if (articlePages[pageNumber]) return null;

      const url = queryString.stringifyUrl({
        url: "/api/utils/paginate",
        query: {
          pageSize,
          cursor: currentCursor,
          author,
        },
      });

      const response = await fetch(url);
      return await response.json();
    },
    [currentCursor, pageSize, articlePages, author],
  );

  const { data: newResponse, isLoading } = useSWR(
    !articlePages[currentPage] ? currentPage.toString() : null,
    fetcher,
  );

  useEffect(() => {
    if (!newResponse) return;

    const { data, newCursor } = newResponse;
    setArticlePages((prev) => {
      if (prev[currentPage]) return prev;

      const result = [...prev];
      result[currentPage] = data;
      return result;
    });
    setCurrentCursor(newCursor);
  }, [newResponse, currentPage]);

  return {
    // Return last page if current page doesn't exist
    data: articlePages[currentPage] || articlePages[articlePages.length - 1],
    fetching: isLoading,
    onPageChange: setCurrentPage,
    currentPage,
  };
}
