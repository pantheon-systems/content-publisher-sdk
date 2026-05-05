import { TargetEnvironment } from "./apiConfig";

jest.mock("./localStorage", () => ({
  getConfigDetails: jest.fn().mockResolvedValue(null),
}));

describe("apiConfig", () => {
  it("has dashboardUrl for all environments", async () => {
    for (const env of Object.values(TargetEnvironment)) {
      process.env.NODE_ENV = env;
      jest.resetModules();
      const { getApiConfig } = await import("./apiConfig");
      const config = await getApiConfig();
      expect(config).toHaveProperty("dashboardUrl");
      expect(config.dashboardUrl).toBeTruthy();
    }
  });

  it("test environment uses reserved .example TLD", async () => {
    process.env.NODE_ENV = "test";
    jest.resetModules();
    const { getApiConfig } = await import("./apiConfig");
    const config = await getApiConfig();
    expect(config.dashboardUrl).toMatch(/\.example$/);
    expect(config.addOnApiEndpoint).toMatch(/\.example\//);
  });
});
