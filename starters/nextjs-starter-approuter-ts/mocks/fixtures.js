const MOCK_SITE = {
  id: "mock-site-id",
  name: "Mock PCC Site",
  url: "https://example.com",
  domain: "example.com",
  contentStructure: JSON.stringify([]),
  tags: [],
  metadataFields: [],
};

const MOCK_ARTICLES = [
  {
    id: "article-001",
    title: "Getting Started with PCC",
    slug: "getting-started",
    tags: ["tutorial", "beginner"],
    siteId: "mock-site-id",
    metadata: JSON.stringify({
      author: "Test Author",
      slug: "getting-started",
    }),
    publishedDate: "2026-01-15T10:00:00Z",
    publishingLevel: "PRODUCTION",
    contentType: "TREE_PANTHEON_V2",
    resolvedContent: null,
    renderAsTabs: false,
    updatedAt: "2026-01-15T10:00:00Z",
    previewActiveUntil: null,
    snippet: "Learn how to set up your first PCC-powered site.",
    content: JSON.stringify({ children: [{ tag: "p", children: ["Hello world."] }] }),
    site: MOCK_SITE,
  },
  {
    id: "article-002",
    title: "Advanced Content Modeling",
    slug: "advanced-content-modeling",
    tags: ["advanced", "content"],
    siteId: "mock-site-id",
    metadata: JSON.stringify({
      author: "Test Author",
      slug: "advanced-content-modeling",
    }),
    publishedDate: "2026-02-01T12:00:00Z",
    publishingLevel: "PRODUCTION",
    contentType: "TREE_PANTHEON_V2",
    resolvedContent: null,
    renderAsTabs: false,
    updatedAt: "2026-02-01T12:00:00Z",
    previewActiveUntil: null,
    snippet: "Deep dive into content modeling with PCC.",
    content: JSON.stringify({ children: [{ tag: "p", children: ["Advanced content."] }] }),
    site: MOCK_SITE,
  },
];

function articleWithoutContent(article) {
  const copy = { ...article };
  delete copy.content;
  return copy;
}

const MOCK_ARTICLES_WITHOUT_CONTENT = MOCK_ARTICLES.map(articleWithoutContent);

module.exports = {
  MOCK_SITE,
  MOCK_ARTICLES,
  MOCK_ARTICLES_WITHOUT_CONTENT,
};
