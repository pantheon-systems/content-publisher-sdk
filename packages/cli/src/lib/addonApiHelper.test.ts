import axios from "axios";
import AddOnApiHelper from "./addonApiHelper";

jest.mock("axios");
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

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("getConnectedAccountAccessToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns access token for a matching account", async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.endsWith("/accounts")) {
        return Promise.resolve({
          data: [
            { id: "acc-1", accountEmail: "user@company.com", name: "Test" },
            { id: "acc-2", accountEmail: "other@company.com", name: "Other" },
          ],
        });
      }
      if (url.includes("/acc-1/get-access-token")) {
        return Promise.resolve({
          data: { accessToken: "goog-token-123", expiresAt: "2026-01-01" },
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const token =
      await AddOnApiHelper.getConnectedAccountAccessToken("user@company.com");
    expect(token).toBe("goog-token-123");
  });

  it("throws when no account matches the email", async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.endsWith("/accounts")) {
        return Promise.resolve({
          data: [
            { id: "acc-1", accountEmail: "other@company.com", name: "Other" },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await expect(
      AddOnApiHelper.getConnectedAccountAccessToken("missing@company.com"),
    ).rejects.toThrow("No connected account found for missing@company.com");
  });

  it("includes guidance to run 'cpub account connect' in the error", async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.endsWith("/accounts")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await expect(
      AddOnApiHelper.getConnectedAccountAccessToken("user@company.com"),
    ).rejects.toThrow("cpub account connect");
  });
});
