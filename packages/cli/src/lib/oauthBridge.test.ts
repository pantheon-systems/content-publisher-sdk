import { buildBridgeHtml } from "./oauthBridge";

jest.mock("open", () => jest.fn());
jest.mock("server-destroy", () => jest.fn());

describe("buildBridgeHtml", () => {
  const options = {
    popupUrl: "https://api.content.pantheon.io/accounts/google?token=abc123",
    pagePath: "/connect",
    title: "Connect Google Account",
    message: "Connecting your Google account...",
  };

  it("includes the title in the page", () => {
    const html = buildBridgeHtml(options);
    expect(html).toContain("<title>Connect Google Account</title>");
  });

  it("includes the message", () => {
    const html = buildBridgeHtml(options);
    expect(html).toContain("Connecting your Google account...");
  });

  it("opens a popup to the provided URL", () => {
    const html = buildBridgeHtml(options);
    expect(html).toContain(`window.open(${JSON.stringify(options.popupUrl)}`);
  });

  it("sends the result to the correct pagePath", () => {
    const html = buildBridgeHtml(options);
    expect(html).toContain("fetch('/connect/result?'");
  });

  it("includes a manual link with rel=opener for blocked popups", () => {
    const html = buildBridgeHtml(options);
    expect(html).toContain(`href="${options.popupUrl}"`);
    expect(html).toContain('rel="opener"');
  });

  it("polls for popup close and reports window_closed", () => {
    const html = buildBridgeHtml(options);
    expect(html).toContain(
      "fetch('/connect/result?success=false&error=window_closed')",
    );
  });
});
