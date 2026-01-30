import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-sdk-core";
import {
  ArticleWithoutContent,
  PaginatedArticle,
} from "@pantheon-systems/cpub-sdk-core/types";
import { useEffect, useState } from "react";

interface Props {
  cursor?: string;
  pageSize: number;
  initialArticles?: PaginatedArticle[] | ArticleWithoutContent[];
}

export function usePagination({ cursor, initialArticles, pageSize }: Props) {
  const [currentCursor, setCurrentCursor] = useState(cursor);
  const [articlePages, setArticlePages] = useState(
    initialArticles ? [initialArticles] : [],
  );
  const [fetching, setFetching] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    (async () => {
      if (articlePages[currentPage]) return;

      setFetching(true);
      const { data, cursor: newCursor } =
        await PCCConvenienceFunctions.getPaginatedArticles({
          pageSize,
          ...(currentCursor && { cursor: currentCursor }),
        });
      setFetching(false);
      setArticlePages((prev) => {
        const result = [...prev];
        result[currentPage] = data;
        return result;
      });
      setCurrentCursor(newCursor);
    })();
  }, [currentPage]);

  return {
    // Return last page if current page doesn't exist
    data: articlePages[currentPage] || articlePages[articlePages.length - 1],
    fetching,
    onPageChange: setCurrentPage,
    currentPage,
  };
}
