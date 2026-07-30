const http = require("node:http");
const {
  MOCK_SITE,
  MOCK_ARTICLES,
  MOCK_ARTICLES_WITHOUT_CONTENT,
} = require("./fixtures");

function handleGraphQL(operationName, variables, query) {
  switch (operationName) {
    case "GetSite":
      return { data: { site: MOCK_SITE } };

    case "GetArticle": {
      const match =
        MOCK_ARTICLES.find(
          (a) =>
            a.id === variables?.id ||
            a.slug === variables?.slug ||
            a.slug === variables?.id,
        ) || MOCK_ARTICLES[0];
      return { data: { article: match } };
    }

    case "ListArticles":
      if (query?.includes("pageInfo")) {
        return {
          data: {
            articlesv3: {
              articles: MOCK_ARTICLES_WITHOUT_CONTENT,
              pageInfo: {
                totalCount: MOCK_ARTICLES_WITHOUT_CONTENT.length,
                nextCursor: null,
              },
            },
          },
        };
      }
      return {
        data: {
          articlesv3: {
            articles: MOCK_ARTICLES_WITHOUT_CONTENT,
            summary: null,
          },
        },
      };

    case "GetRecommendedArticle":
      return { data: { recommendedArticles: MOCK_ARTICLES.slice(0, 1) } };

    default:
      return { data: {} };
  }
}

function startMockServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            const result = handleGraphQL(
              parsed.operationName,
              parsed.variables,
              parsed.query,
            );
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result));
          } catch {
            res.writeHead(400);
            res.end("Bad request");
          }
        });
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      const url = `http://127.0.0.1:${port}`;
      process.env.PCC_HOST = url;
      process.env.NEXT_PUBLIC_PCC_HOST = url;
      console.log(`[CI] Mock PCC API server running at ${url}`);
      resolve({ server, url });
    });
  });
}

module.exports = { startMockServer };
