import { test, expect } from "@playwright/test";

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173";

test("user can enter email and sign up", async ({ page }) => {
  await page.goto(BASE_URL);

  const emailInput = page.getByLabel("Enter your email:");
  await emailInput.fill("user@example.com");
  await page.getByText("Sign up").click();
  await expect(emailInput).toHaveValue("user@example.com");
});

test("user can request frost risk after getting location", async ({ browser }) => {
  const context = await browser.newContext({
    geolocation: { latitude: 47.6062, longitude: -122.3321 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  await page.goto(BASE_URL);
  await page.getByRole("button", { name: "Get Location" }).click();
  await expect(page.locator(".weather-card")).toBeVisible();
  await context.close();
});
