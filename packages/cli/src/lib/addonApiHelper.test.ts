import AddOnApiHelper from "./addonApiHelper";

// Mock fetch globally
global.fetch = jest.fn();

jest.mock("./apiConfig", () => ({
  getApiConfig: jest.fn().mockResolvedValue({
    ACCOUNT_ENDPOINT: "https://test-jest.example/addOnApi/accounts",
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
          json: () => Promise.resolve([
            { id: "acc-1", accountEmail: "user@company.com", name: "Test" },
            { id: "acc-2", accountEmail: "other@company.com", name: "Other" },
          ]),
        } as Response);
      }
      if (urlString.includes("/acc-1/get-access-token")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ accessToken: "goog-token-123", expiresAt: "2026-01-01" }),
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
          json: () => Promise.resolve([
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