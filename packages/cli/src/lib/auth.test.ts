import { Auth0Provider, PersistedTokens } from "./auth";

global.fetch = jest.fn();

jest.mock("./addonApiHelper", () => ({
  __esModule: true,
  default: {
    getAuth0Config: jest.fn().mockResolvedValue({
      clientId: "test-client-id",
      redirectUri: "http://localhost:3000",
      issuerBaseUrl: "https://auth.example.com",
      audience: "https://api.example.com",
    }),
    getCurrentTime: jest.fn().mockResolvedValue(0),
  },
}));

jest.mock("./localStorage", () => ({
  getAuthDetails: jest.fn().mockResolvedValue(null),
  persistAuthDetails: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("open", () => jest.fn().mockResolvedValue(undefined));
jest.mock("ora", () => {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    clear: jest.fn().mockReturnThis(),
  };
  return jest.fn(() => spinner);
});

const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("Auth0Provider.refreshToken", () => {
  const provider = new Auth0Provider();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns valid tokens on successful refresh", async () => {
    const mockTokens = {
      access_token: "new-access-token",
      id_token: "new-id-token",
      scope: "openid profile offline_access",
      token_type: "Bearer",
    };

    mockedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockTokens),
    } as unknown as Response);

    const result = await provider.refreshToken("old-refresh-token");
    expect(result.access_token).toBe("new-access-token");
    expect(result.refresh_token).toBe("old-refresh-token");
  });

  it("throws on invalid_grant instead of returning a bad token object", async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () =>
        Promise.resolve({
          error: "invalid_grant",
          error_description: "Unknown or invalid refresh token.",
        }),
    } as unknown as Response);

    // BUG: Currently this returns { refresh_token, error: "invalid_grant", ... }
    // cast as PersistedTokens — no access_token, silently corrupt.
    // After fix, this should throw.
    await expect(provider.refreshToken("expired-token")).rejects.toThrow();
  });

  it("throws on server error instead of returning garbage", async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new SyntaxError("Unexpected token <")),
      text: () => Promise.resolve("<html>Internal Server Error</html>"),
    } as unknown as Response);

    await expect(provider.refreshToken("some-token")).rejects.toThrow();
  });

  it("does not return an object without access_token on auth failure", async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: () =>
        Promise.resolve({
          error: "access_denied",
          error_description: "Unauthorized",
        }),
    } as unknown as Response);

    let threw = false;
    let result: PersistedTokens | undefined;
    try {
      result = await provider.refreshToken("some-token");
    } catch {
      threw = true;
    }

    // Either it throws (correct) or if it returns, it must have access_token
    if (!threw) {
      expect(result).toBeDefined();
      expect(result!.access_token).toBeDefined();
      expect(typeof result!.access_token).toBe("string");
      expect(result!.access_token.length).toBeGreaterThan(0);
    }
  });
});

describe("Auth0Provider.login - device code flow", () => {
  const provider = new Auth0Provider();

  beforeEach(() => {
    jest.clearAllMocks();
    // getTokens returns null so login proceeds to device code flow
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const localStorage = require("./localStorage");
    localStorage.getAuthDetails.mockResolvedValue(null);
  });

  it("throws a clear error when device code request returns 500", async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new SyntaxError("Unexpected token <")),
      text: () => Promise.resolve("<html>Server Error</html>"),
    } as unknown as Response);

    // BUG: Currently, raw fetch with no ok-check means .json() throws
    // a confusing SyntaxError instead of a meaningful HTTP error.
    // After fix, should throw with HTTP status context.
    await expect(provider.login()).rejects.toThrow();

    // Should not throw SyntaxError from .json() parsing
    try {
      await provider.login();
    } catch (e: unknown) {
      expect(e).not.toBeInstanceOf(SyntaxError);
    }
  });

  it("throws a clear error when token poll returns non-JSON 500", async () => {
    mockedFetch.mockImplementation((url: string | URL | Request) => {
      const urlString = url.toString();

      // First call: getAuth0Config (via AddOnApiHelper mock — not hit here)
      // Device code request succeeds
      if (urlString.includes("/oauth/device/code")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              device_code: "test-device-code",
              verification_uri: "https://auth.example.com/activate",
              user_code: "ABCD-1234",
              interval: 0,
            }),
        } as unknown as Response);
      }

      // Token poll returns 500 with HTML body
      if (urlString.includes("/oauth/token")) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: () => Promise.reject(new SyntaxError("Unexpected token <")),
          text: () => Promise.resolve("<html>Server Error</html>"),
        } as unknown as Response);
      }

      return Promise.reject(new Error(`Unexpected URL: ${urlString}`));
    });

    // BUG: raw fetch + .json() on a 500 HTML response throws SyntaxError
    // uncaught out of the polling loop. After fix, should be a proper HTTP error.
    await expect(provider.login()).rejects.toThrow();

    try {
      await provider.login();
    } catch (e: unknown) {
      expect(e).not.toBeInstanceOf(SyntaxError);
    }
  });
});
