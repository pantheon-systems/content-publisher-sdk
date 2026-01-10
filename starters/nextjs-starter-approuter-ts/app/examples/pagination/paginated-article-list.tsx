"use client";

import {
  ArticleWithoutContent,
  PaginatedArticle,
  Site,
} from "@pantheon-systems/cpub-react-sdk";
import React from "react";
import { ArticleGrid } from "../../../components/grid";
import PageHeader from "../../../components/page-header";
import Pagination from "../../../components/pagination";
import { PAGE_SIZE } from "../../../constants";
import { usePagination } from "../../../hooks/usePagination";

interface Props {
  headerText?: string | null | undefined;
  articles: PaginatedArticle[] | ArticleWithoutContent[];
  totalCount: number;
  cursor: string;
  fetcher: (cursor?: string | null | undefined) => Promise<{
    data: PaginatedArticle[] | ArticleWithoutContent[];
    newCursor: string;
  }>;
  additionalHeader?: React.ReactNode;
  site: Site;
}

export default function PaginatedArticleList({
  headerText,
  articles,
  totalCount,
  cursor,
  fetcher,
  additionalHeader = null,
  site,
}: Props) {
  const {
    data: currentArticles,
    onPageChange,
    fetching,
    currentPage,
  } = usePagination({
    cursor,
    initialArticles: articles,
    fetcher,
  });

  return (
    <section className="max-w-screen-3xl mx-auto px-4 pt-16 sm:w-4/5 md:w-3/4 lg:w-4/5 2xl:w-3/4">
      {headerText ? <PageHeader title={headerText} /> : null}
      {additionalHeader}
      <ArticleGrid
        articles={currentArticles as ArticleWithoutContent[]}
        site={site}
      />
      <div className="mt-4 flex flex-row items-center justify-center">
        <Pagination
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          currentPage={currentPage}
          onChange={onPageChange}
          disabled={fetching}
        />
      </div>
    </section>
  );
}
