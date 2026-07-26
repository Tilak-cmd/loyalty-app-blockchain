import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

test.describe("Privy Auth Debug", () => {
  test("Capture Privy errors on Customer Auth page", async ({ page }) => {
    const errors = [];
    const consoleMsgs = [];

    page.on("console", msg => {
      consoleMsgs.push({ type: msg.type(), text: msg.text() });
    });
    page.on("pageerror", err => {
      errors.push(err.message);
    });

    await page.goto(`${BASE}/customer/auth`);
    await page.waitForTimeout(2000); // Let Privy initialize

    console.log("\n=== Console messages after loading ===");
    consoleMsgs.slice(-10).forEach(m => console.log(`  [${m.type}] ${m.text}`));
    console.log("\n=== Page errors ===");
    errors.forEach(e => console.log(`  ${e}`));

    // Check if Privy provider rendered
    const hasPrivy = await page.evaluate(() => {
      return typeof (window).PrivyProvider !== 'undefined' || document.querySelector('[data-privy]') !== null;
    });
    console.log(`\nPrivy provider found: ${hasPrivy}`);

    // Take screenshot
    await page.screenshot({ path: "screenshots/privy-debug.png", fullPage: true });

    // Check for Privy-related elements
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("\n=== Page text (first 500 chars) ===");
    console.log(bodyText.substring(0, 500));

    expect(errors.length).toBe(0); // No errors should be thrown
  });

  test("Capture Privy errors on Merchant Auth page", async ({ page }) => {
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));

    await page.goto(`${BASE}/merchant/login`);
    await page.waitForTimeout(2000);

    console.log("\n=== Merchant Page errors ===");
    errors.forEach(e => console.log(`  ${e}`));
    await page.screenshot({ path: "screenshots/privy-merchant-debug.png", fullPage: true });

    expect(errors.length).toBe(0);
  });

  test("Capture Privy errors on Admin Login page", async ({ page }) => {
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));

    await page.goto(`${BASE}/admin/login`);
    await page.waitForTimeout(2000);

    console.log("\n=== Admin Page errors ===");
    errors.forEach(e => console.log(`  ${e}`));
    await page.screenshot({ path: "screenshots/privy-admin-debug.png", fullPage: true });

    expect(errors.length).toBe(0);
  });
});
