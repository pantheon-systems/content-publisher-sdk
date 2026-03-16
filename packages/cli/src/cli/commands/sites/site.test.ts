jest.mock("../../../lib/addonApiHelper", () => ({
  __esModule: true,
  default: {
    getSite: jest.fn(),
    updateSiteConfig: jest.fn(),
  },
}));

jest.mock("ora", () => {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
  };
  return jest.fn(() => spinner);
});

import AddOnApiHelper from "../../../lib/addonApiHelper";
import { updateSiteConfig } from "./site";

const mockedGetSite = AddOnApiHelper.getSite as jest.MockedFunction<
  typeof AddOnApiHelper.getSite
>;
const mockedUpdateSiteConfig =
  AddOnApiHelper.updateSiteConfig as jest.MockedFunction<
    typeof AddOnApiHelper.updateSiteConfig
  >;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("updateSiteConfig playground restrictions", () => {
  it("should block configuring a playground site", async () => {
    mockedGetSite.mockResolvedValue({
      id: "playground-1",
      url: "https://example.com",
      __isPlayground: true,
      accessorAccount: "test@test.com",
    });

    await updateSiteConfig({ id: "playground-1", url: "https://new-url.com" });

    expect(mockedGetSite).toHaveBeenCalledWith("playground-1");
    expect(mockedUpdateSiteConfig).not.toHaveBeenCalled();
  });

  it("should allow configuring a non-playground site", async () => {
    mockedGetSite.mockResolvedValue({
      id: "regular-1",
      url: "https://example.com",
      __isPlayground: false,
      accessorAccount: "test@test.com",
    });
    mockedUpdateSiteConfig.mockResolvedValue(undefined as any);

    await updateSiteConfig({ id: "regular-1", url: "https://new-url.com" });

    expect(mockedGetSite).toHaveBeenCalledWith("regular-1");
    expect(mockedUpdateSiteConfig).toHaveBeenCalledWith("regular-1", {
      url: "https://new-url.com",
    });
  });
});
