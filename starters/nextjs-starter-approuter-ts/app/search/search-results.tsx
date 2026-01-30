"use client";

import {
  ArticleWithoutContent,
  markdownToText,
} from "@pantheon-systems/cpub-react-sdk";
import Link from "next/link";
import { Fragment } from "react";
import Skeleton from "react-loading-skeleton";
import Markdown from "react-markdown";
import PageHeader from "../../components/page-header";
import { cn } from "../../lib/utils";

interface Props {
  searchResults: ArticleWithoutContent[] | null;
  summary?: string | null;
  isLoading?: boolean | null;
  error?: boolean;
}

export default function SearchResults({
  searchResults,
  isLoading,
  summary,
  error,
}: Props) {
  return (
    <section className="max-w-screen-3xl mx-auto px-4 pt-16 sm:w-4/5 md:w-3/4 lg:w-4/5 2xl:w-3/4">
      <PageHeader title="Search results" />

      {isLoading || summary ? (
        <section className="my-16 max-w-[707px] rounded-lg border-2 bg-neutral-100 px-4">
          <div className="mt-4">
            <b>✨ Experimental:</b> Generative AI Result Summary
          </div>
          <hr className="my-2" />
          <div className="w-full whitespace-pre-wrap break-words py-4">
            {isLoading ? (
              <Skeleton count={5} />
            ) : summary ? (
              <Markdown>{summary}</Markdown>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="my-16 max-w-[707px]">
        {isLoading || (searchResults && searchResults.length > 0) ? (
          (searchResults ?? Array.from({ length: 5 })).map((result, index) => (
            <Fragment key={result?.id || index}>
              <div>
                {isLoading ? (
                  <Skeleton />
                ) : (
                  <Link
                    href={`/articles/${result.slug || result.id}`}
                    className="text-xl font-medium text-sky-600 visited:text-purple-700"
                  >
                    {result.title}
                  </Link>
                )}

                <p className="my-2 line-clamp-4 whitespace-pre-wrap">
                  {isLoading ? (
                    <Skeleton count={4} />
                  ) : result.snippet ? (
                    markdownToText(result.snippet)
                  ) : null}
                </p>
              </div>

              <hr className="my-8" />
            </Fragment>
          ))
        ) : (
          <div>
            <p
              className={cn("text-xl", error ? "text-red-600" : "text-sky-600")}
            >
              {error ? "An error occurred" : "No results found"}
            </p>

            <div className="mt-4">
              Please try another search.
              <br />
              <ul className="m-auto list-disc px-8">
                <li>Check your search for typos</li>
                <li>Try entering fewer keywords</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
