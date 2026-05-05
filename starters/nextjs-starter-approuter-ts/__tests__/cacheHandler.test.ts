describe("cacheHandler", () => {
  it("next.config.js has cacheHandler configured", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nextConfig = require("../next.config.js");
    expect(nextConfig.cacheHandler).toBeDefined();
    expect(nextConfig.cacheHandler).toContain("cacheHandler.mjs");
    expect(nextConfig.cacheMaxMemorySize).toBe(0);
  });

  it("next.config.js has cacheHandlers configured for 'use cache' directive", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nextConfig = require("../next.config.js");
    expect(nextConfig.cacheHandlers).toBeDefined();
    expect(nextConfig.cacheHandlers.default).toBeDefined();
    expect(nextConfig.cacheHandlers.default).toContain(
      "useCacheHandler.mjs",
    );
  });

  it("next.config.js has cacheComponents enabled", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nextConfig = require("../next.config.js");
    expect(nextConfig.cacheComponents).toBe(true);
  });
});
