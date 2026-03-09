import { test, expect } from "@playwright/test";

test("user can enter phone number and sign up", async ({ page }) => {
  await page.goto("http://localhost:5173");

  const phoneInput = page.getByLabel("Enter a Phone Number:");
  await phoneInput.fill("2065551234");
  await page.getByText("Sign up").click();
  await expect(phoneInput).toHaveValue("2065551234");
});

test("user can request frost risk after getting location", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByRole("button", { name: "Get Location" }).click();
  await page.getByRole("button", { name: "Check Frost Risk" }).click();
  await expect(page.locator(".weather-card")).toBeVisible();
});