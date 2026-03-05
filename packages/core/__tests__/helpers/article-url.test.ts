import { getArticleURLFromSite } from "../../src/helpers";
import { Site } from "../../src/types";

describe("Article URL generation from Site content structure", () => {
  it("should generate the correct URL for an article from a site which has no content structure", () => {
    // Define a site without a content structure
    const site: Site = {
      id: "123",
      name: "test",
      url: "https://test.com",
      domain: "test.com",
      tags: [],
      metadataFields: {},
      contentStructure: {
        active: [],
      },
    };

    const article = {
      id: "test-article",
      slug: "my-article",
      publishingLevel: "PRODUCTION",
    } as const;

    const articleURL = getArticleURLFromSite(article, site);

    expect(articleURL).toBe("/articles/my-article");
  });

  it("should generate the correct URL for an article from a site which has a content structure", () => {
    // Define a site with a content structure
    const site: Site = {
      id: "123",
      name: "test",
      url: "https://test.com",
      domain: "test.com",
      tags: [],
      metadataFields: {},
      contentStructure: {
        active: [
          {
            id: "category-1",
            name: "foo",
            type: "category",
            children: [
              {
                id: "nested-category-1",
                name: "bar",
                type: "category",
                children: [
                  { id: "test-article", name: "baz", type: "article" },
                ],
              },
            ],
          },
        ],
      },
    };

    const article = {
      id: "test-article",
      slug: "my-article",
      publishingLevel: "PRODUCTION",
    } as const;

    const articleURL = getArticleURLFromSite(article, site);

    expect(articleURL).toBe("/articles/foo/bar/my-article");
  });

  it("should generate the correct URL for an article from a site which has a content structure with a base path", () => {
    // Define a site with a content structure
    const site: Site = {
      id: "123",
      name: "test",
      url: "https://test.com",
      domain: "test.com",
      tags: [],
      metadataFields: {},
      contentStructure: {
        active: [
          {
            id: "category-1",
            name: "foo",
            type: "category",
            children: [
              {
                id: "nested-category-1",
                name: "bar",
                type: "category",
                children: [
                  { id: "test-article", name: "baz", type: "article" },
                ],
              },
            ],
          },
        ],
      },
    };

    const article = {
      id: "test-article",
      slug: "my-article",
      publishingLevel: "PRODUCTION",
    } as const;

    const basePath = "/test-articles";

    const articleURL = getArticleURLFromSite(article, site, basePath);
    expect(articleURL).toBe(`${basePath}/foo/bar/my-article`);
  });

  it("should generate URL with maxDepth", () => {
    // Define a site with a content structure
    const site: Site = {
      id: "123",
      name: "test",
      url: "https://test.com",
      domain: "test.com",
      tags: [],
      metadataFields: {},
      contentStructure: {
        active: [
          {
            id: "category-1",
            name: "foo",
            type: "category",
            children: [
              {
                id: "nested-category-1",
                name: "bar",
                type: "category",
                children: [
                  { id: "test-article", name: "baz", type: "article" },
                ],
              },
            ],
          },
        ],
      },
    };

    const article = {
      id: "test-article",
      slug: "my-article",
      publishingLevel: "PRODUCTION",
    } as const;

    const basePath = "/test-articles";

    const articleURL = getArticleURLFromSite(article, site, basePath, 0);
    expect(articleURL).toBe(`${basePath}/my-article`);

    const articleURL2 = getArticleURLFromSite(article, site, basePath, 1);
    expect(articleURL2).toBe(`${basePath}/bar/my-article`);
  });

  it("should use slug for PRODUCTION articles when site is undefined", () => {
    const article = {
      id: "test-article-123",
      slug: "my-article",
      publishingLevel: "PRODUCTION",
    } as const;

    const articleURL = getArticleURLFromSite(article, undefined);

    expect(articleURL).toBe("/articles/my-article");
  });

  it("should use ID for DRAFT articles when site is undefined", () => {
    const article = {
      id: "test-article-123",
      slug: "my-article",
      publishingLevel: "DRAFT",
    } as const;

    const articleURL = getArticleURLFromSite(article, undefined);

    expect(articleURL).toBe("/articles/test-article-123");
  });

  it("should use ID for REALTIME articles when site is undefined", () => {
    const article = {
      id: "test-article-123",
      slug: "my-article",
      publishingLevel: "REALTIME",
    } as const;

    const articleURL = getArticleURLFromSite(article, undefined);

    expect(articleURL).toBe("/articles/test-article-123");
  });

  it("should use ID when article has no slug and site is undefined", () => {
    const article = {
      id: "test-article-123",
      publishingLevel: "PRODUCTION",
    } as const;

    const articleURL = getArticleURLFromSite(article, undefined);

    expect(articleURL).toBe("/articles/test-article-123");
  });
});
