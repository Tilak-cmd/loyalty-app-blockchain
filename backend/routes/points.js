const router = require("express").Router();
const prisma = require("../services/prisma");
const auth = require("../middleware/auth");
const { getBalance, burnFromCustomer, providerReady } = require("../services/blockchain");

router.get("/balance/:email", async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { email: req.params.email } });
  if (!customer) return res.json({ balance: "0", found: false });

  // Also try to get on-chain balance if customer has walletAddress and provider is connected
  let onChainBalance = null;
  if (providerReady && customer.walletAddress) {
    try {
      const merchants = await prisma.merchant.findMany({
        where: { kybStatus: "APPROVED", tokenContract: { not: null } },
        select: { tokenContract: true },
      });
      // For simplicity, sum balances across all merchant tokens
      let total = BigInt(0);
      for (const m of merchants) {
        const bal = await getBalance(m.tokenContract, customer.walletAddress);
        total += BigInt(bal);
      }
      onChainBalance = total.toString();
    } catch (e) {
      console.warn("On-chain balance lookup failed:", e.message);
    }
  }

  res.json({
    balance: customer.pointsBalance.toString(),
    onChainBalance,
    match: onChainBalance !== null ? BigInt(customer.pointsBalance).toString() === onChainBalance : null,
    found: true,
    firstName: customer.firstName,
    lastName: customer.lastName,
  });
});

router.get("/me", auth, async (req, res) => {
  if (req.customer) return res.json({ type: "customer", customer: req.customer });
  if (req.merchant) return res.json({ type: "merchant", merchant: req.merchant });
  if (req.user) return res.json({ type: "user", user: req.user });
  res.status(404).json({ error: "Not found" });
});

// Customer profile
router.get("/profile", auth, async (req, res) => {
  if (!req.customer) return res.status(403).json({ error: "Customer only" });

  // On-chain balance lookup
  let onChainBalance = null;
  let onChainMatch = null;
  if (providerReady && req.customer.walletAddress) {
    try {
      const merchants = await prisma.merchant.findMany({
        where: { kybStatus: "APPROVED", tokenContract: { not: null } },
        select: { tokenContract: true },
      });
      let total = BigInt(0);
      for (const m of merchants) {
        const bal = await getBalance(m.tokenContract, req.customer.walletAddress);
        total += BigInt(bal);
      }
      onChainBalance = total.toString();
      onChainMatch = BigInt(req.customer.pointsBalance).toString() === onChainBalance;
    } catch (e) {
      console.warn("On-chain balance lookup failed:", e.message);
    }
  }

  res.json({
    customer: req.customer,
    onChainBalance,
    onChainMatch,
  });
});

router.patch("/profile", auth, async (req, res) => {
  if (!req.customer) return res.status(403).json({ error: "Customer only" });
  const allowed = ["firstName","lastName","username","phone","dateOfBirth","gender","country","state","city","timezone","language","marketingConsent"];
  const data = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) data[field] = req.body[field];
  }
  if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
  if (data.username) {
    const existing = await prisma.customer.findFirst({ where: { username: data.username, NOT: { id: req.customer.id } } });
    if (existing) return res.status(400).json({ error: "Username taken" });
  }
  const customer = await prisma.customer.update({ where: { id: req.customer.id }, data });
  res.json({ customer });
});

router.get("/transactions", auth, async (req, res) => {
  if (!req.customer) return res.status(403).json({ error: "Customer only" });
  const txs = await prisma.transaction.findMany({
    where: { customerId: req.customer.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ transactions: txs });
});

// Customer redeems points for a merchant's product
router.post("/redeem", auth, async (req, res) => {
  if (!req.customer) return res.status(403).json({ error: "Customer only" });
  const { merchantId, productId } = req.body;
  if (!merchantId || !productId) return res.status(400).json({ error: "Merchant and product required" });

  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant || merchant.kybStatus !== "APPROVED") return res.status(404).json({ error: "Merchant not found" });
  if (!merchant.tokenContract) return res.status(400).json({ error: "Merchant has no token contract" });
  if (!req.customer.walletAddress) return res.status(400).json({ error: "Customer has no wallet address. Contact support." });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.merchantId !== merchantId || !product.isActive) {
    return res.status(404).json({ error: "Product not found" });
  }

  const cost = BigInt(product.tokenPrice);
  const dbBalance = BigInt(req.customer.pointsBalance);

  if (dbBalance < cost) return res.status(400).json({ error: "Insufficient points" });

  // Check on-chain balance if available
  let onChainAvailable = true;
  if (providerReady && merchant.tokenContract && req.customer.walletAddress) {
    try {
      const onChain = BigInt(await getBalance(merchant.tokenContract, req.customer.walletAddress));
      if (onChain < cost) onChainAvailable = false;
    } catch { onChainAvailable = false; }
  }

  let txHash;
  try {
    const receipt = await burnFromCustomer(merchant.tokenContract, req.customer.walletAddress, cost);
    txHash = receipt.hash;
  } catch (e) {
    if (!onChainAvailable) {
      return res.status(400).json({ error: "Insufficient on-chain balance. Please sync your account." });
    }
    console.warn("On-chain burn failed (mock mode):", e.message);
    txHash = "REDEEM:" + Date.now() + ":" + req.customer.id + ":" + productId;
  }

  // Deduct from customer
  await prisma.customer.update({
    where: { id: req.customer.id },
    data: { pointsBalance: dbBalance - cost },
  });

  // Create transaction
  const tx = await prisma.transaction.create({
    data: {
      txHash,
      type: "REDEEM",
      fromAddress: req.customer.walletAddress || "customer",
      toAddress: merchant.walletAddress || merchant.id,
      amount: cost.toString(),
      tokenContract: merchant.tokenContract,
      merchantId: merchant.id,
      customerId: req.customer.id,
    },
  });

  res.json({ success: true, tx, product: { id: product.id, name: product.name } });
});

module.exports = router;
