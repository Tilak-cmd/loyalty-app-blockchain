import { test, expect } from "@playwright/test";

const API = "http://localhost:4000/api";
const MERCHANT_EMAIL = "ksandresh1@gmail.com";
const CUSTOMER_EMAIL = "sandeshnilaskhatwada@gmail.com";
const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXJ4bzBiMngwMDAwNTh4emg5Nnkya3JtIiwiZW1haWwiOiJzLmtoYXRpd2FkYS43NjA3QHdlc3RjbGlmZi5lZHUiLCJpc0FkbWluIjp0cnVlLCJ0eXBlIjoiYWRtaW4iLCJpYXQiOjE3ODUwMjkzNzQsImV4cCI6MTc4NTYzNDE3NH0.TEjL3IrLy0_lYvK2w2ynwm2KX5qKOeEzAQJRo88_Hk8";
const MERCHANT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZXJjaGFudElkIjoiY21yeG53cm1xMDAwMGp0eHphNTAxZGx4ZiIsImVtYWlsIjoia3NhbmRyZXNoMUBnbWFpbC5jb20iLCJ0eXBlIjoibWVyY2hhbnQiLCJpYXQiOjE3ODUwMjkzMzcsImV4cCI6MTc4NTYzNDEzN30.oJQ6900t2eGxEcnfbSpV4bVUpjm3Y4pcY6cSieiUyH8";
const CUST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcklkIjoiY21yeHBhMDNpMDAwMHRueHppenlla3cwayIsImVtYWlsIjoic2FuZGVzaG5pbGFza2hhdHdhZGFAZ21haWwuY29tIiwidHlwZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzg1MDI5MzM3LCJleHAiOjE3ODU2MzQxMzd9.eluhZKoGIO0dTVYJQhgSByYKrnQG1BwQ4Seq_kp-BTI";

test.describe("Full E2E Flow: Admin → Merchant → Customer", () => {

  test.describe("ADMIN PERSPECTIVE", () => {
    test("A1: View stats", async ({ request }) => {
      const r = await request.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      expect(d.stats).toBeTruthy();
      expect(typeof d.stats.totalMerchants).toBe("number");
      console.log("  Stats:", JSON.stringify(d.stats));
    });

    test("A2: View all merchants", async ({ request }) => {
      const r = await request.get(`${API}/admin/merchants`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      expect(d.merchants.length).toBeGreaterThan(0);
      d.merchants.forEach(m => console.log(`  ${m.businessName} | ${m.kybStatus} | balance: ${m.tokenBalance}`));
    });

    test("A3: View pending merchants", async ({ request }) => {
      const r = await request.get(`${API}/admin/merchants/pending`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      console.log(`  Pending merchants: ${d.merchants.length}`);
      d.merchants.forEach(m => console.log(`    ${m.businessName} (${m.email})`));
    });

    test("A4: Admin topup tokens for merchant", async ({ request }) => {
      const r = await request.post(`${API}/admin/merchants/cmrxnwrmq0000jtxza501dlxf/topup`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        data: { amountNPR: 5000 },
      });
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      expect(d.success).toBe(true);
      expect(d.netTokens).toBeGreaterThan(0);
      console.log(`  NPR 5000 → ${d.netTokens} tokens (gross: ${d.grossTokens}, fee: ${d.fee})`);
      console.log(`  On-chain tx: ${d.onChainTx ? d.onChainTx.hash : "skipped (mock)"}`);
      expect(parseInt(d.merchant.tokenBalance) > 0).toBe(true);
      console.log(`  New DB balance: ${d.merchant.tokenBalance}`);
    });
  });

  test.describe("MERCHANT PERSPECTIVE", () => {
    test("M1: View status & balances", async ({ request }) => {
      const r = await request.get(`${API}/merchant/status`, {
        headers: { Authorization: `Bearer ${MERCHANT_TOKEN}` },
      });
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      expect(d.merchant.businessName).toBe("Chia Pasal");
      expect(d.merchant.kybStatus).toBe("APPROVED");
      console.log(`  Business: ${d.merchant.businessName}`);
      console.log(`  Status: ${d.merchant.kybStatus}`);
      console.log(`  DB Balance: ${d.merchant.tokenBalance}`);
      console.log(`  On-chain Balance: ${d.onChainBalance ?? "N/A (mock)"}`);
      console.log(`  Match: ${d.onChainMatch !== null ? (d.onChainMatch ? "✅" : "❌") : "N/A (mock)"}`);
      console.log(`  Token Contract: ${d.merchant.tokenContract || "N/A"}`);
    });

    test("M2: Create Stripe checkout session", async ({ request }) => {
      const r = await request.post(`${API}/merchant/create-checkout-session`, {
        headers: { Authorization: `Bearer ${MERCHANT_TOKEN}` },
        data: { amountNPR: 1000 },
      });
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      expect(d.url).toContain("checkout.stripe.com");
      expect(d.sessionId).toBeTruthy();
      console.log(`  Session ID: ${d.sessionId}`);
      console.log(`  URL: ${d.url}`);
    });

    test("M3: View customers list", async ({ request }) => {
      const r = await request.get(`${API}/merchant/customers`, {
        headers: { Authorization: `Bearer ${MERCHANT_TOKEN}` },
      });
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      console.log(`  Total customers: ${d.customers.length}`);
      d.customers.forEach(c => console.log(`    ${c.name || c.email} | awarded: ${c.totalAwarded} | balance: ${c.pointsBalance}`));
    });

    test("M4: Award points to customer", async ({ request }) => {
      // Get current balance
      const beforeR = await request.get(`${API}/points/balance/${CUSTOMER_EMAIL}`);
      const before = await beforeR.json();
      const prev = BigInt(before.balance);

      const r = await request.post(`${API}/merchant/award`, {
        headers: { Authorization: `Bearer ${MERCHANT_TOKEN}` },
        data: { customerEmail: CUSTOMER_EMAIL, amount: "50" },
      });
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      expect(d.success).toBe(true);
      expect(d.amount).toBe(50);
      console.log(`  Awarded 50 points to ${d.customerEmail}`);
      console.log(`  New customer balance: ${d.customerBalance}`);
      console.log(`  On-chain tx: ${d.onChainTx?.hash || "skipped (mock)"}`);
      expect(BigInt(d.customerBalance)).toBe(prev + BigInt(50));
    });

    test("M5: Award rejected when insufficient balance", async ({ request }) => {
      const r = await request.post(`${API}/merchant/award`, {
        headers: { Authorization: `Bearer ${MERCHANT_TOKEN}` },
        data: { customerEmail: CUSTOMER_EMAIL, amount: "999999999" },
      });
      expect(r.ok()).toBe(false);
      expect(r.status()).toBe(400);
      const d = await r.json();
      expect(d.error).toContain("Insufficient");
      console.log(`  Correctly rejected: ${d.error}`);
    });

    test("M6: Reject invalid award inputs", async ({ request }) => {
      // Missing email
      const r1 = await request.post(`${API}/merchant/award`, {
        headers: { Authorization: `Bearer ${MERCHANT_TOKEN}` },
        data: { customerEmail: "", amount: "10" },
      });
      expect(r1.status()).toBe(400);

      // Zero amount
      const r2 = await request.post(`${API}/merchant/award`, {
        headers: { Authorization: `Bearer ${MERCHANT_TOKEN}` },
        data: { customerEmail: CUSTOMER_EMAIL, amount: "0" },
      });
      expect(r2.status()).toBe(400);
      console.log("  Invalid inputs correctly rejected (400)");
    });
  });

  test.describe("CUSTOMER PERSPECTIVE", () => {
    test("C1: Check balance by email (public)", async ({ request }) => {
      const r = await request.get(`${API}/points/balance/${CUSTOMER_EMAIL}`);
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      expect(d.found).toBe(true);
      expect(d.firstName).toBe("Sandesh");
      expect(d.lastName).toBe("Khatiwada");
      console.log(`  Customer: ${d.firstName} ${d.lastName}`);
      console.log(`  DB Balance: ${d.balance}`);
      console.log(`  On-chain: ${d.onChainBalance ?? "N/A (mock)"}`);
      console.log(`  Match: ${d.match !== null ? (d.match ? "✅" : "❌") : "N/A (mock)"}`);
      expect(parseInt(d.balance) > 0).toBe(true);
    });

    test("C2: Non-existent email returns not found", async ({ request }) => {
      const r = await request.get(`${API}/points/balance/nobody@test.com`);
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      expect(d.found).toBe(false);
      expect(d.balance).toBe("0");
    });

    test("C3: View profile (authenticated)", async ({ request }) => {
      const r = await request.get(`${API}/points/profile`, {
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      });
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      expect(d.customer.email).toBe(CUSTOMER_EMAIL);
      console.log(`  Name: ${d.customer.firstName} ${d.customer.lastName}`);
      console.log(`  Email: ${d.customer.email}`);
      console.log(`  Username: ${d.customer.username || "N/A"}`);
      console.log(`  Points: ${d.customer.pointsBalance}`);
      console.log(`  Wallet: ${d.customer.walletAddress || "N/A"}`);
      console.log(`  On-chain balance: ${d.onChainBalance ?? "N/A (mock)"}`);
    });

    test("C4: Update profile", async ({ request }) => {
      const r = await request.patch(`${API}/points/profile`, {
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
        data: { phone: "+977 9812345678", language: "en", city: "Kathmandu" },
      });
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      expect(d.customer.phone).toBe("+977 9812345678");
      expect(d.customer.language).toBe("en");
      expect(d.customer.city).toBe("Kathmandu");
      console.log("  Profile updated: phone, language, city set");
    });

    test("C5: View transaction history", async ({ request }) => {
      const r = await request.get(`${API}/points/transactions`, {
        headers: { Authorization: `Bearer ${CUST_TOKEN}` },
      });
      expect(r.ok()).toBeTruthy();
      const d = await r.json();
      expect(d.transactions.length).toBeGreaterThanOrEqual(4);
      console.log(`  Total transactions: ${d.transactions.length}`);
      let totalAwarded = BigInt(0);
      d.transactions.forEach((tx, i) => {
        const amt = BigInt(tx.amount);
        if (tx.type === "AWARD") totalAwarded += amt;
        console.log(`  ${i + 1}. ${tx.type} ${tx.amount}pts — ${tx.fromAddress} (${new Date(tx.createdAt).toLocaleDateString()})`);
      });
      console.log(`  Total awarded: ${totalAwarded.toString()}pts`);
    });
  });

  test.describe("RECONCILIATION", () => {
    test("Final state verification", async ({ request }) => {
      console.log("\n  === FINAL STATE ===");

      // Merchant
      const mr = await request.get(`${API}/merchant/status`, {
        headers: { Authorization: `Bearer ${MERCHANT_TOKEN}` },
      });
      const md = await mr.json();
      console.log(`  Merchant: ${md.merchant.businessName}`);
      console.log(`  DB Balance: ${md.merchant.tokenBalance}`);
      console.log(`  On-chain: ${md.onChainBalance ?? "N/A"}`);

      // Customer
      const cr = await request.get(`${API}/points/balance/${CUSTOMER_EMAIL}`);
      const cd = await cr.json();
      console.log(`  Customer: ${cd.firstName} ${cd.lastName}`);
      console.log(`  Points: ${cd.balance}`);
      console.log(`  On-chain: ${cd.onChainBalance ?? "N/A"}`);

      // Stats
      const sr = await request.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      const sd = await sr.json();
      console.log(`  Total Merchants: ${sd.stats.totalMerchants}`);
      console.log(`  Approved: ${sd.stats.approvedMerchants}`);
      console.log(`  Customers: ${sd.stats.totalCustomers}`);
      console.log(`  Transactions: ${sd.stats.totalTransactions}`);
      console.log("  ===================");
    });
  });
});
