import AddOnApiHelper, { fetchWithErrorHandling } from "./addonApiHelper";

// Mock fetch globally
global.fetch = jest.fn();

jest.mock("./apiConfig", () => ({
  getApiConfig: jest.fn().mockResolvedValue({
    ACCOUNT_ENDPOINT: "https://test-jest.example/addOnApi/accounts",
    DOCUMENT_ENDPOINT: "https://test-jest.example/addOnApi/documents",
    AUTH0_ENDPOINT: "https://test-jest.example/addOnApi/auth0/",
  }),
}));
jest.mock("./auth", () => ({
  Auth0Provider: jest.fn().mockImplementation(() => ({
    getTokens: jest.fn().mockResolvedValue({
      access_token: "mock-auth0-token",
      id_token: "mock-id-token",
      refresh_token: "mock-refresh-token",
    }),
  })),
}));

const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("getConnectedAccountAccessToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns access token for a matching account", async () => {
    mockedFetch.mockImplementation((url: string | URL | Request) => {
      const urlString = url.toString();

      if (urlString.endsWith("/accounts")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: "acc-1", accountEmail: "user@company.com", name: "Test" },
              { id: "acc-2", accountEmail: "other@company.com", name: "Other" },
            ]),
        } as Response);
      }
      if (urlString.includes("/acc-1/get-access-token")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              accessToken: "goog-token-123",
              expiresAt: "2026-01-01",
            }),
        } as Response);
      }
      return Promise.reject(new Error(`Unexpected URL: ${urlString}`));
    });

    const token =
      await AddOnApiHelper.getConnectedAccountAccessToken("user@company.com");
    expect(token).toBe("goog-token-123");
  });

  it("throws when no account matches the email", async () => {
    mockedFetch.mockImplementation((url: string | URL | Request) => {
      const urlString = url.toString();

      if (urlString.endsWith("/accounts")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: "acc-1", accountEmail: "other@company.com", name: "Other" },
            ]),
        } as Response);
      }
      return Promise.reject(new Error(`Unexpected URL: ${urlString}`));
    });

    await expect(
      AddOnApiHelper.getConnectedAccountAccessToken("missing@company.com"),
    ).rejects.toThrow("No connected account found for missing@company.com");
  });

  it("includes guidance to run 'cpub account connect' in the error", async () => {
    mockedFetch.mockImplementation((url: string | URL | Request) => {
      const urlString = url.toString();

      if (urlString.endsWith("/accounts")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      }
      return Promise.reject(new Error(`Unexpected URL: ${urlString}`));
    });

    await expect(
      AddOnApiHelper.getConnectedAccountAccessToken("user@company.com"),
    ).rejects.toThrow("cpub account connect");
  });
});

describe("fetchWithErrorHandling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the response on success", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const response = await fetchWithErrorHandling("https://example.com");
    expect(response.ok).toBe(true);
  });

  it("throws with parsed JSON error body on non-ok JSON response", async () => {
    const errorBody = JSON.stringify({
      message: "Invalid input",
      code: "INVALID",
    });
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: () => Promise.resolve(errorBody),
    } as unknown as Response);

    try {
      await fetchWithErrorHandling("https://example.com");
      fail("Should have thrown");
    } catch (e: unknown) {
      const error = e as { status: number; data: unknown };
      expect(error.status).toBe(400);
      expect(error.data).toEqual({ message: "Invalid input", code: "INVALID" });
    }
  });

  it("falls back to text body when response is not JSON", async () => {
    const htmlBody = "<html><body>Internal Server Error</body></html>";
    let bodyConsumed = false;

    mockedFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => {
        bodyConsumed = true;
        return Promise.reject(new SyntaxError("Unexpected token <"));
      },
      text: () => {
        if (bodyConsumed) {
          return Promise.reject(new TypeError("Body is unusable"));
        }
        return Promise.resolve(htmlBody);
      },
    } as unknown as Response);

    try {
      await fetchWithErrorHandling("https://example.com");
      fail("Should have thrown");
    } catch (e: unknown) {
      const error = e as { status: number; data: unknown };
      expect(error.status).toBe(500);
      // BUG: Currently error.data falls through to statusText because
      // .json() consumes the body stream, making .text() throw.
      // After fix, this should contain the HTML body.
      expect(error.data).toBe(htmlBody);
    }
  });
});

describe("getDocumentWithAuth0 - withMetadata serialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("serializes withMetadata as bracket-notation query params, not a JSON string", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "doc-1", title: "Test Article" }),
    } as unknown as Response);

    await AddOnApiHelper.getDocumentWithAuth0(
      "doc-1",
      true,
      false,
      "My Article",
    );

    const calledUrl = mockedFetch.mock.calls[0][0] as string;

    // The server expects bracket-notation: withMetadata[title]=...&withMetadata[slug]=...
    // NOT a JSON-stringified string: withMetadata=%7B%22title%22%3A%22My+Article%22...%7D
    expect(calledUrl).not.toContain(
      encodeURIComponent(
        JSON.stringify({ title: "My Article", slug: "my-article" }),
      ),
    );

    // Should contain bracket-notation keys
    const url = new URL(calledUrl);
    expect(url.searchParams.get("withMetadata[title]")).toBe("My Article");
    expect(url.searchParams.get("withMetadata[slug]")).toBe("my-article");

    // There should be no single "withMetadata" key with a JSON string value
    expect(url.searchParams.get("withMetadata")).toBeNull();
  });

  it("does not include withMetadata when title is not provided", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "doc-1", title: "Test Article" }),
    } as unknown as Response);

    await AddOnApiHelper.getDocumentWithAuth0("doc-1", false, false);

    const calledUrl = mockedFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("withMetadata");
  });
});
