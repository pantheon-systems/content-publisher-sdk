import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest } from "next/server";
import packageJson from "../../package.json";
import { AppRouterContext, NextPantheonAPI } from "../../src/core/pantheon-api";

beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * Assertions that NextPantheonAPI correctly transforms requests to the PantheonAPI
 * and correctly transforms responses from the PantheonAPI for Pages routing and App routing.
 */
const apiHandlerMock = jest.fn();
jest.mock("@pantheon-systems/pcc-sdk-core", () => ({
  PantheonAPI: jest.fn(() => ({
    handler: apiHandlerMock,
    buildStatus: jest.fn(() => ({
      timestamp: new Date().toISOString(),
      level: "basic",
      version: "test",
      siteId: "site",
      smartComponents: false,
      smartComponentsCount: null,
      smartComponentPreview: false,
      metadataGroups: false,
      metadataGroupIdentifiers: null,
      resolvePathConfigured: true,
      notFoundPath: "/404",
    })),
    options: {},
  })),
}));

describe("Pages routing", () => {
  // @ts-expect-error - we're testing the API, we don't intend to fully mock a NextRequest
  const request: NextApiRequest = {
    query: {},
    cookies: {},
  };
  // @ts-expect-error - we're testing the API, we don't intend to fully mock a NextResponse
  const response: NextApiResponse = {
    setHeader: jest.fn(),
    getHeader: jest.fn(),
    redirect: jest.fn(),
    json: jest.fn(),
  };

  it("should pass query params to the API correctly", async () => {
    // Simulate a request with query params
    // @ts-expect-error - partial request object
    const testRequest = {
      ...request,
      query: { command: "test", foo: "bar", 1: "2" },
    } as NextApiRequest;

    await NextPantheonAPI()(testRequest, response);

    // Assert the API handler was called with the correct query params
    expect(apiHandlerMock).toHaveBeenCalledWith(
      {
        query: {
          command: "test",
          foo: "bar",
          1: "2",
        },
        cookies: {},
      },
      expect.any(Object),
    );
  });

  it("should pass cookies to the API correctly", async () => {
    // Simulate a request with cookies
    // @ts-expect-error - partial request object
    const testRequest = {
      ...request,
      cookies: { session: "123", grant: "test", foo: "bar" },
    } as NextApiRequest;

    await NextPantheonAPI()(testRequest, response);

    // Assert the API handler was called with the correct cookies
    expect(apiHandlerMock).toHaveBeenCalledWith(
      {
        query: {},
        cookies: {
          session: "123",
          grant: "test",
          foo: "bar",
        },
      },
      expect.any(Object),
    );
  });

  it("should return JSON responses correctly", async () => {
    // Data we expect to be returned by the API handler
    const responseData = { status: "ok" };

    // @ts-expect-error - partial response object
    const testResponse = {
      ...response,
      json: jest.fn(),
    } as NextApiResponse;

    // When the API handler is called, it calls res.json with the response data
    apiHandlerMock.mockImplementationOnce(async (req, res) => {
      await res.json(responseData);
    });

    await NextPantheonAPI()(request, testResponse);

    // Assert that after passing through NextPantheonAPI, Next's response.json was called with the exact data
    // sent by the API handler
    expect(testResponse.json).toHaveBeenCalledWith(responseData);
  });

  it("should return redirect responses correctly", async () => {
    // @ts-expect-error - partial response object
    const testResponse = {
      ...response,
      redirect: jest.fn(),
    } as NextApiResponse;

    // When the API handler is called, it calls res.redirect with the status and path
    apiHandlerMock.mockImplementationOnce(async (req, res) => {
      await res.redirect(301, "/new-path");
    });

    await NextPantheonAPI()(request, testResponse);

    // Assert that after passing through NextPantheonAPI, Next's response.redirect was called with the exact status and path
    // sent by the API handler
    expect(testResponse.redirect).toHaveBeenCalledWith(301, "/new-path");
  });

  it("should return responses with headers correctly", async () => {
    // @ts-expect-error - partial response object
    const testResponse = {
      ...response,
      setHeader: jest.fn(),
    } as NextApiResponse;

    // When the API handler is called, it sets a header and then calls res.json with the response data
    apiHandlerMock.mockImplementationOnce(async (req, res) => {
      res.setHeader("Content-Type", "application/json");
    });

    await NextPantheonAPI()(request, testResponse);

    // Assert that after passing through NextPantheonAPI, Next's response.setHeader was called with the exact key and value
    // sent by the API handler
    expect(testResponse.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
  });

  it("adds platform diagnostics for status requests", async () => {
    // @ts-expect-error - partial response object
    const testResponse = {
      ...response,
      json: jest.fn(),
    } as NextApiResponse;

    // @ts-expect-error - partial request object
    const statusRequest = {
      ...request,
      query: { command: "status" },
    } as NextApiRequest;

    await NextPantheonAPI()(statusRequest, testResponse);

    expect(testResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: expect.objectContaining({
          name: "next",
          version: null,
          sdk: expect.objectContaining({
            name: "pcc-react-sdk",
            version: packageJson.version,
          }),
          routing: expect.objectContaining({ mode: "pages" }),
          runtime: expect.stringMatching(/^(edge|node)$/),
        }),
      }),
    );
  });
});

describe("App routing", () => {
  it("should pass query params to the API correctly", async () => {
    const request = new NextRequest(
      "http://localhost:3000/?command=test&foo=bar&1=2",
    );
    const params = {
      params: Promise.resolve({
        testParam: "123",
        command: ["test"],
      }),
    } satisfies AppRouterContext;

    await NextPantheonAPI()(request, params);

    // Assert the API handler was called with the correct query params
    expect(apiHandlerMock).toHaveBeenCalledWith(
      {
        query: {
          command: "test",
          1: "2",
          foo: "bar",
          // Expecting params to be merged into query
          testParam: "123",
        },
        cookies: {},
      },
      expect.any(Object),
    );
  });

  it("should pass cookies to the API correctly", async () => {
    const request = new NextRequest("http://localhost:3000/");
    request.cookies.set("session", "123");
    request.cookies.set("grant", "test");
    request.cookies.set("foo", "bar");

    const params = {
      params: Promise.resolve({
        testParam: "123",
        command: [] as string[],
      }),
    } satisfies AppRouterContext;

    await NextPantheonAPI()(request, params);

    // Assert the API handler was called with the correct cookies
    expect(apiHandlerMock).toHaveBeenCalledWith(
      {
        query: {
          testParam: "123",
        },
        cookies: {
          session: "123",
          grant: "test",
          foo: "bar",
        },
      },
      expect.any(Object),
    );
  });

  it("should return JSON responses correctly", async () => {
    const responseData = { status: "ok" };

    const request = new NextRequest("http://localhost:3000/");
    const params = {
      params: Promise.resolve({
        command: [] as string[],
      }),
    } satisfies AppRouterContext;

    // When the API handler is called, it calls res.json with the response data
    apiHandlerMock.mockImplementationOnce(async (req, res) => {
      return await res.json(responseData);
    });

    const apiResponse = await NextPantheonAPI()(request, params);

    // Assert that after passing through NextPantheonAPI, the response is an instance of Response
    // and that the response body is the JSON data sent by the API handler
    expect(apiResponse).toBeInstanceOf(Response);
    expect(await (apiResponse as Response).json()).toEqual(responseData);
  });

  it("should return redirect responses correctly", async () => {
    const request = new NextRequest("http://localhost:3000/");
    const params = {
      params: Promise.resolve({
        command: [] as string[],
      }),
    } satisfies AppRouterContext;

    // When the API handler is called, it calls res.redirect with the status and path
    apiHandlerMock.mockImplementationOnce(async (req, res) => {
      return await res.redirect(301, "/new-path");
    });

    const apiResponse = await NextPantheonAPI()(request, params);

    // Assert that after passing through NextPantheonAPI, the response is an instance of Response
    // and that the response has the correct status and headers set by the API handler
    expect(apiResponse).toBeInstanceOf(Response);
    expect((apiResponse as Response).status).toBe(301);
    expect((apiResponse as Response).headers.get("Location")).toBe("/new-path");
  });

  it("should return responses with headers correctly", async () => {
    const responseData = { status: "ok" };

    const request = new NextRequest("http://localhost:3000/");
    const params = {
      params: Promise.resolve({
        command: [] as string[],
      }),
    } satisfies AppRouterContext;

    // When the API handler is called, it sets a header and then calls res.json with the response data
    apiHandlerMock.mockImplementationOnce(async (req, res) => {
      await res.setHeader("Content-Type", "application/json");
      return await res.json(responseData);
    });

    const apiResponse = await NextPantheonAPI()(request, params);

    // Assert that after passing through NextPantheonAPI, the response is an instance of Response
    // and that the response has the correct headers set by the API handler and the correct JSON data
    expect(apiResponse).toBeInstanceOf(Response);
    expect((apiResponse as Response).headers.get("Content-Type")).toBe(
      "application/json",
    );
    expect(await (apiResponse as Response).json()).toEqual(responseData);
  });

  it("adds platform diagnostics for status requests", async () => {
    const request = new NextRequest("http://localhost:3000/?command=status");
    const params = {
      params: Promise.resolve({
        command: [] as string[],
      }),
    } satisfies AppRouterContext;

    const apiResponse = await NextPantheonAPI()(request, params);

    expect(apiResponse).toBeInstanceOf(Response);
    const payload = await (apiResponse as Response).json();

    expect(payload).toEqual(
      expect.objectContaining({
        platform: expect.objectContaining({
          name: "next",
          version: null,
          sdk: expect.objectContaining({
            name: "pcc-react-sdk",
            version: packageJson.version,
          }),
          routing: expect.objectContaining({ mode: "app" }),
          runtime: expect.stringMatching(/^(edge|node)$/),
        }),
      }),
    );
  });
});
