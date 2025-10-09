/**
 * @jest-environment jsdom
 */

import { Article } from "@pantheon-systems/pcc-sdk-core/types";
import { render } from "@testing-library/react";
import { ArticleRenderer, getArticleTitle } from "../../src/components";
import articleTabbedContent from "../data/article-tabbed-content.json";
import articleWithDoubleCaptions from "../data/article-with-double-captions.json";
import articleWithImageMarkdown from "../data/article-with-image-markdown.json";
import articleWithImageTree from "../data/article-with-image-tree.json";
import article from "../data/article.json";

describe("<ArticleRenderer />", () => {
  it("should render a post's content", () => {
    const { container } = render(
      <ArticleRenderer article={article as Article} />,
    );
    const title = getArticleTitle(article as Article);
    expect(title).toEqual("Test 1");
    expect(container.firstChild).toMatchSnapshot();
  });

  it("should replace the CDN URL with the override (markdown)", () => {
    const { container } = render(
      <ArticleRenderer
        article={articleWithImageMarkdown as Article}
        __experimentalFlags={{ cdnURLOverride: "cdn.example.com" }}
      />,
    );
    expect(container.innerHTML).toMatch("https://cdn.example.com");
    expect(container.innerHTML).not.toMatch("https://cdn.staging.content");
    expect(container.firstChild).toMatchSnapshot();
  });

  it("should replace the CDN URL with the override (markdown)", () => {
    const defaultTabTree = render(
      <ArticleRenderer
        article={articleTabbedContent as Article}
        __experimentalFlags={{ cdnURLOverride: "cdn.example.com" }}
      />,
    ).container.innerHTML;

    const tab1Tree = render(
      <ArticleRenderer
        article={articleTabbedContent as Article}
        tabId="t.0"
        __experimentalFlags={{ cdnURLOverride: "cdn.example.com" }}
      />,
    ).container.innerHTML;

    expect(defaultTabTree).toEqual(tab1Tree);
    expect(tab1Tree.includes("Tab 1")).toBe(true);
    expect(tab1Tree.includes("Tab 2")).toBe(false);
    expect(tab1Tree).toMatchSnapshot();

    const tab2Tree = render(
      <ArticleRenderer
        article={articleTabbedContent as Article}
        tabId="t.tlembaievla6"
        __experimentalFlags={{ cdnURLOverride: "cdn.example.com" }}
      />,
    ).container.innerHTML;

    expect(tab2Tree.includes("Tab 1")).toBe(false);
    expect(tab2Tree.includes("Tab 2")).toBe(true);
    expect(tab2Tree).toMatchSnapshot();
  });

  it("should replace the CDN URL with the override (tree)", () => {
    const { container } = render(
      <ArticleRenderer
        article={articleWithImageTree as Article}
        __experimentalFlags={{ cdnURLOverride: "cdn.example.com" }}
      />,
    );
    expect(container.innerHTML.includes("https://cdn.example.com")).toBe(true);
    expect(container.innerHTML.includes("https://cdn.staging.content")).toBe(
      false,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("should replace the CDN URL with the override (markdown with function)", () => {
    const { container } = render(
      <ArticleRenderer
        article={articleWithImageMarkdown as Article}
        __experimentalFlags={{
          cdnURLOverride: (url) =>
            url.replace(
              /cdn\.staging\.content.pantheon.io\/[^/]+/,
              "cdn.example.com",
            ),
        }}
      />,
    );

    expect(
      container.innerHTML.includes(
        "https://cdn.example.com/djHVTYbPaCby44H5CxhH",
      ),
    ).toBe(true);
    expect(
      container.innerHTML.includes(
        "https://cdn.staging.content.pantheon.io/loAWY0YB0HTHexSzw3Z1/djHVTYbPaCby44H5CxhH",
      ),
    ).toBe(false);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("should replace the CDN URL with the override (tree with function)", () => {
    const { container } = render(
      <ArticleRenderer
        article={articleWithImageTree as Article}
        __experimentalFlags={{
          cdnURLOverride: (url) =>
            url.replace(
              /cdn\.staging\.content.pantheon.io\/[^/]+/,
              "cdn.example.com",
            ),
        }}
      />,
    );
    expect(
      container.innerHTML.includes(
        "https://cdn.example.com/djHVTYbPaCby44H5CxhH",
      ),
    ).toBe(true);
    expect(
      container.innerHTML.includes(
        "https://cdn.staging.content.pantheon.io/loAWY0YB0HTHexSzw3Z1/djHVTYbPaCby44H5CxhH",
      ),
    ).toBe(false);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("should not render double captions", () => {
    const { container } = render(
      <ArticleRenderer article={articleWithDoubleCaptions as Article} />,
    );
    expect(container.innerHTML.match("TEST CAPTION")?.length).toEqual(1);
  });
});
