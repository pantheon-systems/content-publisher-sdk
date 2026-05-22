"use client";

import {
  ArticleWithoutContent,
  PaginatedArticle,
  Site,
} from "@pantheon-systems/cpub-react-sdk";
import React, { useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { ArticleGridCard } from "./grid";
import PageHeader from "./page-header";

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

export default function ArticleList({
  headerText,
  articles,
  totalCount,
  cursor,
  fetcher,
  additionalHeader = null,
  site,
}: Props) {
  const [allArticles, setAllArticles] = useState(articles);
  const [pageCursor, setPageCursor] = useState(cursor);
  const [isLoading, setIsLoading] = useState(false);

  const { isLg } = useBreakpoint("lg");
  const { isXl } = useBreakpoint("xl");

  const numColumns = useMemo(() => {
    if (isXl) {
      return 3;
    } else if (isLg) {
      return 2;
    } else {
      return 1;
    }
  }, [isLg, isXl]);

  const skeletonCards = useMemo(() => {
    if (!isLoading) return [];
    let numMissing = numColumns - (allArticles.length % numColumns);
    if (numMissing === numColumns) return [];

    // If the row has 2 spaces, but there's only 1 more item
    // to retrieve, then limit the skeleton card to 1.
    if (allArticles.length + numMissing > totalCount) {
      numMissing = allArticles.length + numMissing - totalCount;
    }

    return new Array(numMissing).fill(0);
  }, [isLoading, allArticles, totalCount, numColumns]);

  return (
    <section className="max-w-screen-3xl mx-auto px-4 pt-16 sm:w-4/5 md:w-3/4 lg:w-4/5 2xl:w-3/4">
      {headerText ? <PageHeader title={headerText} /> : null}
      {additionalHeader}
      <InfiniteScroll
        dataLength={allArticles.length}
        next={() => {
          setIsLoading(true);
          fetcher(pageCursor)
            .then(({ data, newCursor }) => {
              if (data?.length) {
                setAllArticles(
                  (v) =>
                    [...v, ...data] as
                      | PaginatedArticle[]
                      | ArticleWithoutContent[],
                );
              }

              setPageCursor(newCursor);
            })
            .catch(console.error)
            .finally(() => {
              setIsLoading(false);
            });
        }}
        hasMore={allArticles.length < totalCount}
        loader={
          isLoading ? (
            <div className="mt-4 flex h-8 w-full items-center justify-center">
              <svg
                className="mr-3 h-5 w-5 animate-spin text-black"
                fill="none"
                viewBox="0 0 24 24"
              >
                {" "}
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : null
        }
      >
        <div
          className={
            "grid grid-cols-1 gap-8 pb-4 lg:grid-cols-2 xl:grid-cols-3"
          }
        >
          {(allArticles as ArticleWithoutContent[]).map((article) => (
            <ArticleGridCard
              key={article.id}
              article={article}
              basePath={"/articles"}
              site={site}
            />
          ))}
          {skeletonCards.map((x, i) => (
            <div key={i} className="rounded-xl bg-[#f5f5f5]">
              &nbsp;
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </section>
  );
}
