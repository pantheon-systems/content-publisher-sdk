import AddOnApiHelper from "./addonApiHelper";

const fetchMock = jest.spyOn(global, "fetch");

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

describe("getConnectedAccountAccessToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns access token for a matching account", async () => {
    fetchMock.mockImplementation((input: string | URL | Request) => {
      const url = input.toString();
      if (url.endsWith("/accounts")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { id: "acc-1", accountEmail: "user@company.com", name: "Test" },
              { id: "acc-2", accountEmail: "other@company.com", name: "Other" },
            ]),
            { status: 200 },
          ),
        );
      }
      if (url.includes("/acc-1/get-access-token")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              accessToken: "goog-token-123",
              expiresAt: "2026-01-01",
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const token =
      await AddOnApiHelper.getConnectedAccountAccessToken("user@company.com");
    expect(token).toBe("goog-token-123");
  });

  it("throws when no account matches the email", async () => {
    fetchMock.mockImplementation((input: string | URL | Request) => {
      const url = input.toString();
      if (url.endsWith("/accounts")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { id: "acc-1", accountEmail: "other@company.com", name: "Other" },
            ]),
            { status: 200 },
          ),
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await expect(
      AddOnApiHelper.getConnectedAccountAccessToken("missing@company.com"),
    ).rejects.toThrow("No connected account found for missing@company.com");
  });

  it("includes guidance to run 'cpub account connect' in the error", async () => {
    fetchMock.mockImplementation((input: string | URL | Request) => {
      const url = input.toString();
      if (url.endsWith("/accounts")) {
        return Promise.resolve(
          new Response(JSON.stringify([]), { status: 200 }),
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await expect(
      AddOnApiHelper.getConnectedAccountAccessToken("user@company.com"),
    ).rejects.toThrow("cpub account connect");
  });
});
