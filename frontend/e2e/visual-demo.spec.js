import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

test.describe("Visual Demo — Step by Step", () => {

  function mockCustomerApi(page) {
    return Promise.all([
      page.route("**/api/points/me", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ type: "customer", customer: { id: "demo-customer", email: "demo@test.com", firstName: "Demo", lastName: "User" } }),
        });
      }),
      page.route("**/api/points/profile", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ customer: { id: "demo-customer", email: "demo@test.com", firstName: "Demo", lastName: "User", username: "demouser", phone: "+977 9812345678", country: "Nepal", pointsBalance: "250", walletAddress: "0x1234...abcd" } }),
        });
      }),
      page.route("**/api/points/transactions", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            transactions: [
              { id: "tx1", type: "AWARD", amount: "100", fromAddress: "merchant@store.com", createdAt: new Date().toISOString() },
              { id: "tx2", type: "AWARD", amount: "50", fromAddress: "shop@example.com", createdAt: new Date(Date.now() - 86400000).toISOString() },
              { id: "tx3", type: "REDEEM", amount: "30", fromAddress: "customer", createdAt: new Date(Date.now() - 172800000).toISOString() },
            ],
          }),
        });
      }),
      page.route("**/api/points/balance/*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ balance: "250", onChainBalance: "250", match: true, found: true, firstName: "Demo", lastName: "User" }),
        });
      }),
    ]);
  }

  function mockAdminApi(page) {
    return Promise.all([
      page.route("**/api/admin/merchants", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            merchants: [
              { id: "m1", businessName: "Chia Pasal", email: "merchant@store.com", kybStatus: "APPROVED", status: "ACTIVE", tokenBalance: "5000", tokenContract: "0xabc", walletAddress: "0xdef", createdAt: new Date().toISOString() },
              { id: "m2", businessName: "Himalayan Tea", email: "tea@shop.com", kybStatus: "PENDING", status: "ACTIVE", tokenBalance: "0", createdAt: new Date().toISOString() },
              { id: "m3", businessName: "Kathmandu Crafts", email: "crafts@store.com", kybStatus: "PENDING", status: "ACTIVE", tokenBalance: "0", createdAt: new Date().toISOString() },
            ],
          }),
        });
      }),
      page.route("**/api/admin/stats", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ stats: { totalMerchants: 3, approvedMerchants: 1, pendingMerchants: 2, totalCustomers: 5, totalTransactions: 12 } }),
        });
      }),
      page.route("**/api/admin/merchants/pending", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            merchants: [
              { id: "m2", businessName: "Himalayan Tea", email: "tea@shop.com", kybStatus: "PENDING", createdAt: new Date().toISOString() },
              { id: "m3", businessName: "Kathmandu Crafts", email: "crafts@store.com", kybStatus: "PENDING", createdAt: new Date().toISOString() },
            ],
          }),
        });
      }),
    ]);
  }

  function mockMerchantApi(page) {
    return Promise.all([
      page.route("**/api/merchant/status", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ merchant: { id: "demo-merchant", businessName: "Chia Pasal", email: "merchant@store.com", kybStatus: "APPROVED", tokenBalance: "5000", tokenContract: "0xabc...123", walletAddress: "0xmerchant...wallet", status: "ACTIVE" }, onChainBalance: "5000", onChainMatch: true }),
        });
      }),
      page.route("**/api/merchant/customers", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            customers: [
              { email: "demo@test.com", name: "Demo User", totalAwarded: "150", pointsBalance: "250", lastAward: new Date().toISOString() },
              { email: "alice@test.com", name: "Alice", totalAwarded: "300", pointsBalance: "300", lastAward: new Date(Date.now() - 86400000).toISOString() },
            ],
          }),
        });
      }),
    ]);
  }

  test("Step 1: Landing Page", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1000);
    await expect(page.locator("text=LoyalChain").first()).toBeVisible();
    await page.screenshot({ path: "screenshots/01-landing.png", fullPage: true });
    await page.getByRole("button", { name: "Customer Login" }).first().click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/customer\/auth/);
  });

  test("Step 2: Customer Registration Form", async ({ page }) => {
    await page.goto(`${BASE}/customer/auth`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: "screenshots/02-customer-register.png", fullPage: true });
    await page.locator('input[placeholder="First"]').fill("Demo");
    await page.locator('input[placeholder="Last"]').fill("User");
    await page.locator('input[placeholder="your@email.com"]').fill("demo@test.com");
    await page.locator('input[placeholder="Choose a username"]').fill("demouser");
    await page.locator('input[placeholder="+977 98XXXXXXXX"]').fill("+977 9812345678");
    await page.locator('input[placeholder="Nepal"]').fill("Nepal");
    await page.screenshot({ path: "screenshots/03-customer-form-filled.png", fullPage: true });
    await expect(page.locator('button:has-text("Continue with Email")')).toBeEnabled();
  });

  test("Step 3: Customer Login Mode", async ({ page }) => {
    await page.goto(`${BASE}/customer/auth`);
    await page.locator("text=Sign in").click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Welcome Back")).toBeVisible();
    await page.locator('input[placeholder="your@email.com"]').fill("demo@test.com");
    await page.screenshot({ path: "screenshots/04-customer-login.png", fullPage: true });
    await expect(page.locator('button:has-text("Continue with Email")')).toBeEnabled();
  });

  test("Step 4: Customer Dashboard (mocked)", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("loyalchain_token", "demo-token");
      localStorage.setItem("loyalchain_type", "customer");
    });
    await mockCustomerApi(page);
    await page.goto(`${BASE}/customer/dashboard`);
    await page.waitForTimeout(1500);
    await expect(page.locator("text=Demo User")).toBeVisible();
    await page.screenshot({ path: "screenshots/05-customer-dashboard.png", fullPage: true });
    await expect(page.locator("text=My Profile").first()).toBeVisible();
    await expect(page.getByText("Total Earned")).toBeVisible();
    await expect(page.getByText("Total Redeemed")).toBeVisible();
    await expect(page.getByText("Recent Activity")).toBeVisible();
  });

  test("Step 5: Customer Profile (mocked)", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("loyalchain_token", "demo-token");
      localStorage.setItem("loyalchain_type", "customer");
    });
    await mockCustomerApi(page);
    await page.goto(`${BASE}/customer/profile`);
    await page.waitForTimeout(1500);
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();
    await page.screenshot({ path: "screenshots/06-customer-profile.png", fullPage: true });
    await expect(page.locator('input[value="Demo"]')).toBeVisible();
    await expect(page.locator("text=Save Changes")).toBeVisible();
  });

  test("Step 6: Merchant Registration Form", async ({ page }) => {
    await page.goto(`${BASE}/merchant/login`);
    await page.waitForTimeout(500);
    await expect(page.locator("text=Register Your Business")).toBeVisible();
    await page.screenshot({ path: "screenshots/07-merchant-register.png", fullPage: true });
    await page.locator('input[placeholder="Your business name"]').fill("Chia Pasal");
    await page.locator('input[placeholder="Legal name (if different)"]').fill("Chia Pasal Pvt Ltd");
    await page.locator('input[placeholder="+977 98XXXXXXXX"]').fill("+977 9849237568");
    await page.locator('input[placeholder="Nepal"]').fill("Nepal");
    await page.locator('input[placeholder="https://example.com"]').fill("https://chia-pasal.com");
    await page.screenshot({ path: "screenshots/08-merchant-form-filled.png", fullPage: true });
  });

  test("Step 7: Admin Login Page", async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await page.waitForTimeout(500);
    await expect(page.locator("text=Admin Login")).toBeVisible();
    await page.locator('input[type="email"]').fill("admin@loyalchain.io");
    await page.screenshot({ path: "screenshots/09-admin-login.png", fullPage: true });
    await expect(page.locator('button:has-text("Continue with Email")')).toBeEnabled();
  });

  test("Step 8: Admin Panel (mocked)", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("loyalchain_token", "admin-token");
      localStorage.setItem("loyalchain_type", "admin");
    });
    // Mock both admin API and the auth check
    await mockAdminApi(page);
    await page.route("**/api/points/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ type: "user", user: { id: "admin1", email: "admin@loyalchain.io", isAdmin: true } }),
      });
    });
    await page.goto(`${BASE}/admin`);
    await page.waitForTimeout(2000);
    await expect(page.getByRole("heading", { name: "Admin Panel" })).toBeVisible();
    // Default tab shows pending merchants
    await expect(page.getByText("Pending Merchant Approvals")).toBeVisible();
    await expect(page.locator("text=Himalayan Tea").first()).toBeVisible();
    await expect(page.locator("text=Kathmandu Crafts").first()).toBeVisible();
    // Switch to All Merchants tab to see approved merchants
    await page.getByRole("button", { name: "All Merchants" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Chia Pasal")).toBeVisible();
    await page.screenshot({ path: "screenshots/10-admin-panel.png", fullPage: true });
  });

  test("Step 9: Merchant Dashboard (mocked)", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("loyalchain_token", "merchant-token");
      localStorage.setItem("loyalchain_type", "merchant");
    });
    await mockCustomerApi(page);
    await mockMerchantApi(page);
    await page.route("**/api/points/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ type: "merchant", merchant: { id: "demo-merchant", businessName: "Chia Pasal", email: "merchant@store.com" } }),
      });
    });
    await page.goto(`${BASE}/merchant/dashboard`);
    await page.waitForTimeout(2000);
    await expect(page.getByRole("heading", { name: "Merchant Dashboard" })).toBeVisible();
    await page.screenshot({ path: "screenshots/11-merchant-dashboard.png", fullPage: true });
    await expect(page.locator("text=Buy Tokens").first()).toBeVisible();
    await expect(page.locator("text=Award Points").first()).toBeVisible();
  });

  test("Step 10: Balance Check via Playwright request", async ({ request, page }) => {
    const r = await request.get("http://localhost:4000/api/points/balance/sandeshnilaskhatwada@gmail.com");
    const data = await r.json();
    expect(data.found).toBe(true);
    expect(data.balance).toBeTruthy();
    expect(parseInt(data.balance) > 0).toBe(true);
    await page.goto(BASE);
    await page.waitForTimeout(500);
    await page.screenshot({ path: "screenshots/12-api-balance.png", fullPage: true });
  });
});
