import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

test.describe("Landing Page", () => {
  test("loads with title and navigation buttons", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator("text=Namchepoints").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Customer Login" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Merchant Login" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Admin Login" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Get Started Free" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" }).first()).toBeVisible();
  });

  test("shows feature cards", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator("text=Earn Everywhere")).toBeVisible();
    await expect(page.locator("text=Cross-Merchant Network")).toBeVisible();
    await expect(page.locator("text=Simple Sign-In")).toBeVisible();
  });

  test("footer renders", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator("text=Loyalty Rewards Platform")).toBeVisible();
  });
});

test.describe("Customer Auth Page", () => {
  test("registration form shows all fields", async ({ page }) => {
    await page.goto(`${BASE}/customer/auth`);
    await expect(page.locator("text=Create Your Account")).toBeVisible();
    await expect(page.locator("text=First Name *")).toBeVisible();
    await expect(page.locator("text=Last Name *")).toBeVisible();
    await expect(page.locator("text=Username")).toBeVisible();
    await expect(page.locator("text=Phone")).toBeVisible();
    await expect(page.locator("text=Date of Birth")).toBeVisible();
    await expect(page.locator("text=Gender")).toBeVisible();
    await expect(page.locator("text=Country")).toBeVisible();
    await expect(page.locator('button:has-text("Continue")')).toBeVisible();
    await expect(page.locator("text=Already have an account?")).toBeVisible();
  });

  test("can switch to login mode", async ({ page }) => {
    await page.goto(`${BASE}/customer/auth`);
    await page.locator("text=Sign in").click();
    await expect(page.locator("text=Welcome Back")).toBeVisible();
    await expect(page.locator('button:has-text("Sign in with Email")')).toBeVisible();
    await expect(page.locator("text=Don't have an account?")).toBeVisible();
  });

  test("login mode can switch back to register", async ({ page }) => {
    await page.goto(`${BASE}/customer/auth`);
    await page.locator("text=Sign in").click();
    await expect(page.locator("text=Welcome Back")).toBeVisible();
    await page.locator("text=Create one").click();
    await expect(page.locator("text=Create Your Account")).toBeVisible();
  });

  test("validation: button disabled without first and last name", async ({ page }) => {
    await page.goto(`${BASE}/customer/auth`);
    await expect(page.locator('button:has-text("Continue")')).toBeDisabled();
    await page.locator('input[placeholder="First"]').fill("John");
    await expect(page.locator('button:has-text("Continue")')).toBeDisabled();
    await page.locator('input[placeholder="Last"]').fill("Doe");
    await expect(page.locator('button:has-text("Continue")')).toBeEnabled();
  });

  test("Privy info notice shown on registration form", async ({ page }) => {
    await page.goto(`${BASE}/customer/auth`);
    await expect(page.locator("text=verify your email via Privy")).toBeVisible();
  });

  test("back link returns to landing", async ({ page }) => {
    await page.goto(`${BASE}/customer/auth`);
    await page.locator("text=Back").click();
    await expect(page).toHaveURL(BASE + "/");
  });
});

test.describe("Merchant Auth Page", () => {
  test("loads with registration form", async ({ page }) => {
    await page.goto(`${BASE}/merchant/login`);
    await expect(page.locator("text=Register Your Business")).toBeVisible();
    await expect(page.getByText("Business Name *")).toBeVisible();
  });
});

test.describe("Admin Login Page", () => {
  test("loads with admin login form", async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await expect(page.locator("text=Admin Login")).toBeVisible();
    await expect(page.getByText("Sign in with your admin email", { exact: true })).toBeVisible();
    await expect(page.locator('button:has-text("Sign in with Email")')).toBeVisible();
  });
});

test.describe("Dashboard Redirect", () => {
  test("unauthenticated users cannot access customer dashboard", async ({ page }) => {
    await page.goto(`${BASE}/customer/dashboard`);
    await expect(page).toHaveURL(/customer\/auth/);
  });

  test("unauthenticated users cannot access merchant dashboard", async ({ page }) => {
    await page.goto(`${BASE}/merchant/dashboard`);
    await expect(page).toHaveURL(/merchant\/login/);
  });

  test("unauthenticated users cannot access admin panel", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await expect(page).toHaveURL(/admin\/login/);
  });
});

test.describe("Sidebar Navigation (mocked auth)", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API calls to return mock customer data so AuthProvider doesn't redirect
    await page.route("**/api/points/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ type: "customer", customer: { id: "test-customer", email: "test@test.com", firstName: "Test", lastName: "User" } }),
      });
    });
    await page.route("**/api/points/profile", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ customer: { id: "test-customer", email: "test@test.com", firstName: "Test", lastName: "User", pointsBalance: "100" } }),
      });
    });
    await page.route("**/api/points/transactions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ transactions: [] }),
      });
    });
    await page.addInitScript(() => {
      localStorage.setItem("namchepoints_token", "mock-token");
      localStorage.setItem("namchepoints_type", "customer");
    });
  });

  test("customer sidebar shows customer nav items", async ({ page }) => {
    await page.goto(`${BASE}/customer/dashboard`);
    await expect(page.locator("text=Namchepoints")).toBeVisible();
    await expect(page.getByRole("link", { name: "My Profile" })).toBeVisible();
    await page.getByRole("link", { name: "My Profile" }).click();
    await expect(page).toHaveURL(/customer\/profile/);
  });

  test("customer profile page loads", async ({ page }) => {
    await page.goto(`${BASE}/customer/profile`);
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();
    await expect(page.locator("text=Save Changes")).toBeVisible();
  });
});

test.describe("Merchant Points Balance API", () => {
  test("balance endpoint returns not found for unknown email", async ({ request }) => {
    const r = await request.get(`${BASE.replace("5173", "4000")}/api/points/balance/nonexistent@test.com`);
    expect(r.ok()).toBeTruthy();
    const b = await r.json();
    expect(b.found).toBe(false);
    expect(b.balance).toBe("0");
  });

  test("health endpoint is healthy", async ({ request }) => {
    const r = await request.get(`${BASE.replace("5173", "4000")}/api/health`);
    expect(r.ok()).toBeTruthy();
    const b = await r.json();
    expect(b.ok).toBe(true);
  });
});
