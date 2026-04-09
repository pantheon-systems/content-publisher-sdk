import { createCacheHandler } from "@pantheon-systems/nextjs-cache-handler";
import { createUseCacheHandler } from "@pantheon-systems/nextjs-cache-handler/use-cache";
import fs from "fs";
import path from "path";

// Use a unique temp dir per test run to avoid conflicts
const TEST_CACHE_BASE = path.join(
  process.cwd(),
  ".next",
  "cache",
  "test-" + Date.now(),
);

afterAll(() => {
  // Clean up test cache directories
  try {
    fs.rmSync(TEST_CACHE_BASE, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

describe("cacheHandler", () => {
  it("createCacheHandler returns a class with the expected cache handler interface", () => {
    const CacheHandler = createCacheHandler({ type: "file" });
    expect(CacheHandler).toBeDefined();
    expect(CacheHandler.prototype.get).toBeTypeOf("function");
    expect(CacheHandler.prototype.set).toBeTypeOf("function");
    expect(CacheHandler.prototype.revalidateTag).toBeTypeOf("function");
    expect(CacheHandler.prototype.resetRequestCache).toBeTypeOf("function");
  });

  it("auto mode returns file handler when CACHE_BUCKET is not set", () => {
    delete process.env.CACHE_BUCKET;
    const CacheHandler = createCacheHandler({ type: "auto" });
    expect(CacheHandler).toBeDefined();
    expect(CacheHandler.prototype.get).toBeTypeOf("function");
  });

  it("cache handler can be instantiated", () => {
    const CacheHandler = createCacheHandler({ type: "file" });
    const handler = new CacheHandler({
      fs: {},
      serverDistDir: "/tmp/test-cache",
      revalidatedTags: [],
    });
    expect(handler).toBeDefined();
    expect(handler.get).toBeTypeOf("function");
    expect(handler.set).toBeTypeOf("function");
    expect(handler.revalidateTag).toBeTypeOf("function");
  });

  it("cache handler get returns null for missing keys", async () => {
    const CacheHandler = createCacheHandler({ type: "file" });
    const handler = new CacheHandler({
      fs: {},
      serverDistDir: "/tmp/test-cache-miss",
      revalidatedTags: [],
    });
    const result = await handler.get("nonexistent-key");
    expect(result).toBeNull();
  });

  it("cache handler set writes a fetch cache entry to disk", async () => {
    const CacheHandler = createCacheHandler({ type: "file" });
    const handler = new CacheHandler({
      fs: {},
      serverDistDir: "/tmp/test-cache-write",
      revalidatedTags: [],
    });

    const testData = {
      kind: "FETCH",
      data: {
        headers: {},
        body: "dGVzdA==",
        url: "https://example.com/api",
        status: 200,
      },
      revalidate: 60,
    };

    await handler.set("test-write-key", testData, {
      fetchCache: true,
      fetchUrl: "https://example.com/api",
      fetchIdx: 0,
      tags: ["test-tag"],
      revalidate: 60,
    });

    // Verify the file was written to the fetch cache directory
    const fetchCacheDir = path.join(process.cwd(), ".next", "cache", "fetch-cache");
    const cacheFile = path.join(fetchCacheDir, "test-write-key.json");
    expect(fs.existsSync(cacheFile)).toBe(true);

    const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    expect(cached.value.kind).toBe("FETCH");
    expect(cached.tags).toContain("test-tag");

    // Clean up
    fs.unlinkSync(cacheFile);
  });

  it("cache handler set and get round-trips a fetch cache entry", async () => {
    const CacheHandler = createCacheHandler({ type: "file" });
    const handler = new CacheHandler({
      fs: {},
      serverDistDir: "/tmp/test-cache-roundtrip",
      revalidatedTags: [],
    });

    const testData = {
      kind: "FETCH",
      data: {
        headers: {},
        body: "dGVzdA==",
        url: "https://example.com/api",
        status: 200,
      },
      revalidate: 60,
    };

    await handler.set("roundtrip-key", testData, {
      fetchCache: true,
      fetchUrl: "https://example.com/api",
      fetchIdx: 0,
      tags: ["roundtrip-tag"],
      revalidate: 60,
    });

    // Pass fetch context to get so it looks in the fetch cache directory
    const result = await handler.get("roundtrip-key", {
      fetchCache: true,
      fetchUrl: "https://example.com/api",
      fetchIdx: 0,
      tags: [],
    });
    expect(result).not.toBeNull();
    expect(result.value.kind).toBe("FETCH");
    expect(result.tags).toContain("roundtrip-tag");

    // Clean up
    const fetchCacheDir = path.join(process.cwd(), ".next", "cache", "fetch-cache");
    try { fs.unlinkSync(path.join(fetchCacheDir, "roundtrip-key.json")); } catch { /* ignore cleanup errors */ }
  });

  it("cache handler revalidateTag invalidates tagged entries", async () => {
    const CacheHandler = createCacheHandler({ type: "file" });
    const handler = new CacheHandler({
      fs: {},
      serverDistDir: "/tmp/test-cache-revalidate",
      revalidatedTags: [],
    });

    const testData = {
      kind: "FETCH",
      data: {
        headers: {},
        body: "dGVzdA==",
        url: "https://example.com/api",
        status: 200,
      },
      revalidate: 60,
    };

    await handler.set("tagged-key", testData, {
      fetchCache: true,
      fetchUrl: "https://example.com/api",
      fetchIdx: 0,
      tags: ["invalidate-me"],
      revalidate: 60,
    });

    // Wait for tags buffer to flush
    await new Promise((resolve) => setTimeout(resolve, 200));

    const fetchCtx = {
      fetchCache: true,
      fetchUrl: "https://example.com/api",
      fetchIdx: 0,
      tags: [],
    };

    const before = await handler.get("tagged-key", fetchCtx);
    expect(before).not.toBeNull();

    await handler.revalidateTag("invalidate-me");

    const after = await handler.get("tagged-key", fetchCtx);
    expect(after).toBeNull();
  });

  it("next.config.js has cacheHandler configured", () => {
    const nextConfig = require("../next.config.js");
    expect(nextConfig.cacheHandler).toBeDefined();
    expect(nextConfig.cacheHandler).toContain("cacheHandler.mjs");
    expect(nextConfig.cacheMaxMemorySize).toBe(0);
  });

  it("next.config.js has cacheHandlers configured for 'use cache' directive", () => {
    const nextConfig = require("../next.config.js");
    expect(nextConfig.cacheHandlers).toBeDefined();
    expect(nextConfig.cacheHandlers.default).toBeDefined();
    expect(nextConfig.cacheHandlers.default).toContain(
      "useCacheHandler.mjs",
    );
  });

  it("next.config.js has cacheComponents enabled", () => {
    const nextConfig = require("../next.config.js");
    expect(nextConfig.cacheComponents).toBe(true);
  });
});

describe("useCacheHandler", () => {
  it("createUseCacheHandler returns a handler with the expected interface", () => {
    const UseCacheHandler = createUseCacheHandler({ type: "file" });
    expect(UseCacheHandler).toBeDefined();
    expect(UseCacheHandler.prototype.get).toBeTypeOf("function");
    expect(UseCacheHandler.prototype.set).toBeTypeOf("function");
  });

  it("auto mode returns file handler when CACHE_BUCKET is not set", () => {
    delete process.env.CACHE_BUCKET;
    const UseCacheHandler = createUseCacheHandler({ type: "auto" });
    expect(UseCacheHandler).toBeDefined();
    expect(UseCacheHandler.prototype.get).toBeTypeOf("function");
  });
});
