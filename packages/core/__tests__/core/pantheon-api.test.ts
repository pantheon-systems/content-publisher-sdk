import { SmartComponentMap } from "../../src";
import {
  ApiRequest,
  ApiResponse,
  PantheonAPI,
  setCookie,
} from "../../src/core/pantheon-api";
import {
  getArticleBySlugOrId,
  PCCConvenienceFunctions,
} from "../../src/helpers";
import { parseJwt } from "../../src/lib/jwt";

const mockResponse = {
  setHeader: vi.fn(),
  getHeader: vi.fn(),
  redirect: vi.fn(),
  json: vi.fn(),
} satisfies ApiResponse;

const mockRequest = {
  query: {},
  cookies: {},
} satisfies ApiRequest;

vi.mock("../../src/helpers/", () => ({
  PCCConvenienceFunctions: {
    buildPantheonClient: vi.fn(),
  },
  getArticleBySlugOrId: vi.fn(),
  getArticleURLFromSite: vi.fn(),
  getSite: vi.fn(),
}));

vi.mock("../../src/lib/jwt", () => ({
  parseJwt: vi.fn(),
}));

afterEach(() => {
  vi.resetAllMocks();
});

describe("Initialization", () => {
  it("initializes correctly with default options", () => {
    const api = PantheonAPI();

    expect(api).toBeDefined();

    // Should expose a handler that accepts two arguments
    expect(typeof api.handler).toBe("function");
    expect(api.handler.length).toBe(2);

    // Should have default options
    expect(api.options).toBeDefined();
    expect(api.options.notFoundPath).toBe("/404");
    expect(api.options.resolvePath).toBeDefined();
    expect(api.options.getPantheonClient).toBeDefined();
    expect(api.options.getSiteId).toBeDefined();
  });

  it("initializes correctly with given options", () => {
    const resolvePath = vi.fn();
    const getPantheonClient = vi.fn();
    const getSiteId = vi.fn();

    const api = PantheonAPI({
      notFoundPath: "/my-not-found-path",
      resolvePath,
      getPantheonClient,
      getSiteId,
    });

    expect(api).toBeDefined();
    expect(typeof api.handler).toBe("function");
    expect(api.handler.length).toBe(2);

    // Should have given options
    expect(api.options).toBeDefined();
    expect(api.options.notFoundPath).toBe("/my-not-found-path");
    expect(api.options.resolvePath).toBe(resolvePath);
    expect(api.options.getPantheonClient).toBe(getPantheonClient);
    expect(api.options.getSiteId).toBe(getSiteId);
  });
});

// Common request handling ops tests
describe("Request Handling", () => {
  it("sets Access-Control-Allow-Origin header to *", async () => {
    const api = PantheonAPI();

    await api.handler(mockRequest, mockResponse);

    // Allow CORS access from any origin
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "*",
    );
  });

  it("sets PCC-GRANT cookie correctly when pccGrant is provided", async () => {
    const api = PantheonAPI();

    await api.handler(
      {
        ...mockRequest,
        query: {
          command: "status",
          pccGrant: "test-grant",
        },
      },
      mockResponse,
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith("Set-Cookie", [
      "PCC-GRANT=test-grant; Path=/; SameSite=None;Secure;",
    ]);
  });

  it("removes the grant cookie if it is for a different site", async () => {
    const api = PantheonAPI({
      getSiteId: () => "test-site-id",
    });
    const mockedParseJwt = vi.mocked(parseJwt);

    mockedParseJwt.mockReturnValue({
      siteId: "different-site-id",
    });

    await api.handler(
      {
        ...mockRequest,
        query: {
          command: "status",
        },
        cookies: {
          "PCC-GRANT": "test-grant",
        },
      },
      mockResponse,
    );

    expect(mockResponse.setHeader).toHaveBeenLastCalledWith("Set-Cookie", [
      "PCC-GRANT=deleted; Path=/; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ]);
  });

  it("skips removing the grant cookie if the JWT is invalid", async () => {
    const api = PantheonAPI();
    const mockedParseJwt = vi.mocked(parseJwt);

    mockedParseJwt.mockImplementation(() => {
      throw new Error("Invalid JWT");
    });

    await api.handler(
      {
        ...mockRequest,
        query: {
          command: "status",
        },
        cookies: {
          "PCC-GRANT": "test-grant",
        },
      },
      mockResponse,
    );

    expect(mockResponse.setHeader).not.toHaveBeenCalledWith("Set-Cookie", [
      "PCC-GRANT=deleted; Path=/; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ]);
  });
});

describe("Command Handling", () => {
  it("redirects to notFoundPath when commandInput is missing", async () => {
    const api = PantheonAPI({
      notFoundPath: "/my-custom-not-found-path",
    });

    await api.handler(mockRequest, mockResponse);

    expect(mockResponse.redirect).toHaveBeenCalledWith(
      302,
      "/my-custom-not-found-path",
    );
  });

  describe("Command: status", () => {
    const request = {
      ...mockRequest,
      query: {
        command: "status",
      },
    } satisfies ApiRequest;

    it("returns smart component status for status command", async () => {
      const api = PantheonAPI();

      await api.handler(request, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          smartComponents: false,
          smartComponentPreview: false,
        }),
      );
    });

    it("returns truthy smartComponents status for api with smartComponents configured", async () => {
      const api = PantheonAPI({
        smartComponentMap: {},
      });

      await api.handler(request, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          smartComponents: true,
          smartComponentPreview: false,
        }),
      );
    });

    it("returns truthy smartComponentPreview status for api with smartComponentPreview configured", async () => {
      const api = PantheonAPI({
        componentPreviewPath: () => "/preview",
      });

      await api.handler(request, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          smartComponents: false,
          smartComponentPreview: true,
        }),
      );
    });

    it("returns truthy smartComponents and smartComponentPreview status for api with both configured", async () => {
      const api = PantheonAPI({
        smartComponentMap: {},
        componentPreviewPath: () => "/preview",
      });

      await api.handler(request, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          smartComponents: true,
          smartComponentPreview: true,
        }),
      );
    });

    it("does not return SDK version in status endpoint response", async () => {
      const api = PantheonAPI();

      await api.handler(request, mockResponse);

      const jsonCall = mockResponse.json.mock.calls[0]?.[0];
      expect(jsonCall).not.toHaveProperty("version");
      expect(jsonCall).not.toHaveProperty("platform");
    });
  });

  describe("Command: document", () => {
    const request = {
      ...mockRequest,
      query: {
        command: "document",
      },
    } satisfies ApiRequest;

    it("redirects to notFoundPath for document command with invalid article ID", async () => {
      const api = PantheonAPI();

      await api.handler(request, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(302, "/404");
    });

    it("retrieves article and redirects for document command with valid article ID", async () => {
      vi.mocked(getArticleBySlugOrId).mockResolvedValue({
        id: "test-article-id",
        resolvedContent: "Article content",
        contentType: "TEXT_MARKDOWN",
        title: "Article title",
        tags: [],
        publishingLevel: "PRODUCTION",
        metadata: {},
        previewActiveUntil: null,
        publishedDate: Date.now(),
        updatedAt: Date.now(),
      });
      const pantheonClientMock = vi.mocked(
        PCCConvenienceFunctions.buildPantheonClient,
      );

      const api = PantheonAPI({
        resolvePath: ({ id }) => `/test-articles-path/${id}`,
      });

      await api.handler(
        {
          ...request,
          query: {
            command: "document/test-article-id",
            pccGrant: "pcc_grant ABC-DEF",
          },
        },
        mockResponse,
      );

      // Validate grant is passed to PantheonClient
      expect(pantheonClientMock).toHaveBeenCalledWith({
        pccGrant: "pcc_grant ABC-DEF",
        isClientSide: false,
      });

      // Validate getArticleBySlugOrId is called with correct parameters
      expect(getArticleBySlugOrId).toHaveBeenCalledWith(
        undefined, // PantheonClient mock
        "test-article-id",
        {
          publishingLevel: undefined,
        },
      );

      // Validate cookie is set
      expect(mockResponse.setHeader).toHaveBeenCalledWith("Set-Cookie", [
        "PCC-GRANT=pcc_grant ABC-DEF; Path=/; SameSite=None;Secure;",
      ]);

      // Validate redirect URL is correct
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        302,
        "/test-articles-path/test-article-id?pccGrant=pcc_grant%20ABC-DEF",
      );
    });

    it("redirects to notFound path if getArticleBySlugOrId returns null", async () => {
      vi.mocked(getArticleBySlugOrId).mockResolvedValue(null);

      const api = PantheonAPI();

      await api.handler(
        {
          ...request,
          query: {
            command: "document/test-article-id",
          },
        },
        mockResponse,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(302, "/404");
    });
  });

  describe("Command: component_schema", () => {
    const request = {
      ...mockRequest,
      query: {
        command: "component_schema",
      },
    } satisfies ApiRequest;

    const defaultSmartComponentMap = {
      TEST_COMPONENT: {
        title: "Test Component",
        fields: {
          prop1: {
            displayName: "Property 1",
            type: "string",
            required: true,
          },
        },
      },
    } satisfies SmartComponentMap;

    it("returns entire smart component map for component_schema command without filter", async () => {
      const api = PantheonAPI({
        smartComponentMap: defaultSmartComponentMap,
      });

      await api.handler(request, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(defaultSmartComponentMap);
    });

    it("returns schema for specified component filter for component_schema command with filter", async () => {
      const api = PantheonAPI({
        smartComponentMap: defaultSmartComponentMap,
      });

      await api.handler(
        {
          ...request,
          query: {
            // test_component is expected to be upper-cased
            command: "component_schema/test_component",
          },
        },
        mockResponse,
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        defaultSmartComponentMap["TEST_COMPONENT"],
      );
    });

    it("redirects to notFoundPath for component_schema command without smart component map", async () => {
      const api = PantheonAPI();

      await api.handler(request, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(302, "/404");
    });
  });

  describe("Command: component", () => {
    const request = {
      ...mockRequest,
      query: {
        command: "component",
      },
    } satisfies ApiRequest;

    it("redirects to notFoundPath for component command when PantheonAPI is configured without a preview path", async () => {
      const api = PantheonAPI();

      await api.handler(request, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(302, "/404");
    });

    it("redirects to notFoundPath for component command without component name", async () => {
      const api = PantheonAPI({
        componentPreviewPath: () => "/preview",
      });

      await api.handler(
        {
          ...request,
          query: {
            command: "component",
          },
        },
        mockResponse,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(302, "/404");
    });

    it("redirects to preview path with correct query parameters for component command with valid component name", async () => {
      const api = PantheonAPI({
        componentPreviewPath: (componentName) =>
          `/preview-component/${componentName}`,
      });

      await api.handler(
        {
          ...request,
          query: {
            command: "component/test-component",
            prop1: "value1",
          },
        },
        mockResponse,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        302,
        "/preview-component/test-component?prop1=value1",
      );
    });
  });

  it("redirects to notFoundPath for unknown commands", async () => {
    const api = PantheonAPI();

    await api.handler(
      {
        ...mockRequest,
        query: {
          command: "unknown",
        },
      },
      mockResponse,
    );

    expect(mockResponse.redirect).toHaveBeenCalledWith(302, "/404");
  });
});

describe("setCookie", () => {
  it("adds new cookie correctly when there are no existing cookies", async () => {
    mockResponse.getHeader.mockReturnValue(undefined);

    await setCookie(mockResponse, "TEST_COOKIE=test-value");

    expect(mockResponse.setHeader).toHaveBeenCalledWith("Set-Cookie", [
      "TEST_COOKIE=test-value",
    ]);
  });

  it("appends new cookie value to existing cookies correctly", async () => {
    mockResponse.getHeader.mockReturnValue("EXISTING_COOKIE=existing-value");

    await setCookie(mockResponse, "TEST_COOKIE=test-value");

    expect(mockResponse.setHeader).toHaveBeenCalledWith("Set-Cookie", [
      "EXISTING_COOKIE=existing-value",
      "TEST_COOKIE=test-value",
    ]);
  });

  it("appends new cookie value to existing cookies correctly when multiple cookies are present", async () => {
    mockResponse.getHeader.mockReturnValue(
      "EXISTING_COOKIE=existing-value; ANOTHER_COOKIE=another-value",
    );

    await setCookie(mockResponse, "TEST_COOKIE=test-value");

    expect(mockResponse.setHeader).toHaveBeenCalledWith("Set-Cookie", [
      "EXISTING_COOKIE=existing-value; ANOTHER_COOKIE=another-value",
      "TEST_COOKIE=test-value",
    ]);
  });
});

describe("Edge Cases", () => {
  it("handles invalid commandInput type correctly", async () => {
    const api = PantheonAPI();

    await api.handler(
      {
        ...mockRequest,
        query: {
          // @ts-expect-error - command should be a string
          command: 123,
        },
      },
      mockResponse,
    );

    expect(mockResponse.redirect).toHaveBeenCalledWith(302, "/404");
  });
});

describe("Status builder", () => {
  it("exposes buildStatus and returns core fields (basic)", () => {
    const api = PantheonAPI();
    const status = api.buildStatus();
    expect(status).toEqual(
      expect.objectContaining({
        level: "basic",
        timestamp: expect.any(String),
        smartComponents: expect.any(Boolean),
        smartComponentPreview: expect.any(Boolean),
        resolvePathConfigured: expect.any(Boolean),
        notFoundPath: expect.any(String),
      }),
    );
    expect("siteId" in (status as Record<string, unknown>)).toBe(true);
  });
});
