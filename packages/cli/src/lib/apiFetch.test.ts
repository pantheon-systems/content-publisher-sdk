import { apiFetch, HttpError } from "./addonApiHelper";

const fetchMock = jest.spyOn(global, "fetch");

jest.mock("./apiConfig", () => ({
  getApiConfig: jest.fn().mockResolvedValue({}),
}));
jest.mock("./auth", () => ({
  Auth0Provider: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("apiFetch", () => {
  it("does not send a body or Content-Type when body is null", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await apiFetch("https://example.com/api", {
      method: "POST",
      body: null,
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.body).toBeUndefined();
    expect(
      (init?.headers as Record<string, string>)?.["Content-Type"],
    ).toBeUndefined();
  });

  it("does not send a body or Content-Type when body is undefined", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await apiFetch("https://example.com/api", { method: "GET" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.body).toBeUndefined();
    expect(
      (init?.headers as Record<string, string>)?.["Content-Type"],
    ).toBeUndefined();
  });

  it("sends JSON body and Content-Type when body is provided", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), { status: 200 }),
    );

    await apiFetch("https://example.com/api", {
      method: "POST",
      body: { name: "test" },
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.body).toBe(JSON.stringify({ name: "test" }));
    expect((init?.headers as Record<string, string>)?.["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("returns undefined data for 204 No Content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await apiFetch("https://example.com/api", {
      method: "DELETE",
    });

    expect(result.data).toBeUndefined();
    expect(result.response.status).toBe(204);
  });

  it("throws HttpError with status and parsed body on non-ok response", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Not found" }), { status: 404 }),
    );

    const err = await apiFetch("https://example.com/api").catch((e) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(404);
    expect(err.responseData).toEqual({ message: "Not found" });
    expect(err.message).toBe("Not found");
  });

  it("falls back to text when error response is not JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response("Bad Gateway", {
        status: 502,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    const err = await apiFetch("https://example.com/api").catch((e) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(502);
    expect(err.responseData).toBe("Bad Gateway");
    expect(err.message).toBe("HTTP 502");
  });

  it("appends query params from the params option", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    await apiFetch("https://example.com/api", {
      params: { limit: 10, offset: 0, empty: null },
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("limit=10");
    expect(url).toContain("offset=0");
    expect(url).not.toContain("empty");
  });
});
