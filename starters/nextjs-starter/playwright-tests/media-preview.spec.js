import { expect, test } from "@playwright/test";

test("loads youtube component", async ({ page }) => {
  await page.goto(
    "/component-preview/MEDIA_PREVIEW?attrs=eyJ1cmwiOiJodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PWdJZDRZYjVRZXZrIn0=%3D%3D",
  );

  // Wait for the page to fully load
  await page.waitForLoadState("networkidle");

  // Click the get started link.
  await expect(
    page.locator(
      "iframe[src*='https://fast.wistia.net/embed/iframe/9mz11isa6g']",
    ),
  ).toBeVisible();
});

test("loads unsupported media preview", async ({ page }) => {
  await page.goto("/component-preview/MEDIA_PREVIEW?attrs=e30=%3D%3D");

  // Wait for the page to fully load
  await page.waitForLoadState("networkidle");

  // Click the get started link.
  await expect(
    page.locator("img").and(page.getByAltText("Unsupported Media Preview URL")),
  ).toBeVisible();
  await expect(page.locator("iframe")).not.toBeVisible();
});
