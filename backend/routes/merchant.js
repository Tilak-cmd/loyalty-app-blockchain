const router = require("express").Router();
const prisma = require("../services/prisma");
const { sign } = require("../services/jwt");
const auth = require("../middleware/auth");
const { mintTokens, burnFromCustomer, getBalance, providerReady } = require("../services/blockchain");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

function requireMerchant(req, res, next) {
  if (!req.merchant) return res.status(403).json({ error: "Merchant only" });
  if (req.merchant.kybStatus !== "APPROVED") return res.status(403).json({ error: "Merchant not approved" });
  next();
}

router.get("/status", auth, async (req, res) => {
  if (!req.merchant) return res.status(404).json({ error: "Not a merchant account" });

  let onChainBalance = null;
  if (providerReady && req.merchant.tokenContract && req.merchant.walletAddress) {
    try {
      onChainBalance = await getBalance(req.merchant.tokenContract, req.merchant.walletAddress);
    } catch (e) {
      console.warn("On-chain balance lookup failed:", e.message);
    }
  }

  res.json({
    merchant: req.merchant,
    onChainBalance,
    onChainMatch: onChainBalance !== null ? BigInt(req.merchant.tokenBalance).toString() === onChainBalance : null,
  });
});

router.post("/refresh-token", auth, async (req, res) => {
  if (!req.merchant) return res.status(403).json({ error: "Merchant only" });
  const token = sign({ merchantId: req.merchant.id, email: req.merchant.email, type: "merchant" });
  res.json({ token });
});

router.post("/award", auth, requireMerchant, async (req, res) => {
  const { customerEmail, amount } = req.body;
  if (!customerEmail || !amount || +amount <= 0) return res.status(400).json({ error: "Valid email and amount required" });

  const merchant = req.merchant;

  // Check on-chain balance first (source of truth), fallback to DB
  let onChainBalance = null;
  if (providerReady && merchant.tokenContract && merchant.walletAddress) {
    try {
      onChainBalance = await getBalance(merchant.tokenContract, merchant.walletAddress);
    } catch (e) {
      console.warn("On-chain balance check failed, using DB:", e.message);
    }
  }
  const availableBalance = onChainBalance !== null ? onChainBalance : merchant.tokenBalance;
  if (BigInt(availableBalance) < BigInt(amount)) {
    return res.status(400).json({ error: "Insufficient token balance" });
  }

  let customer = await prisma.customer.findUnique({ where: { email: customerEmail } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { email: customerEmail, firstName: customerEmail.split("@")[0], isActive: true },
    });
  }

  let onChainTx = null;
  if (providerReady && merchant.tokenContract && merchant.walletAddress && customer.walletAddress) {
    try {
      await burnFromCustomer(merchant.tokenContract, merchant.walletAddress, BigInt(amount));
      onChainTx = await mintTokens(merchant.tokenContract, customer.walletAddress, BigInt(amount));
    } catch (e) {
      return res.status(500).json({ error: "On-chain award failed — DB not updated. " + e.message });
    }
  } else if (providerReady && customer.walletAddress && (!merchant.tokenContract || !merchant.walletAddress)) {
    return res.status(400).json({ error: "Merchant has no token contract. Contact support." });
  }

  await prisma.merchant.update({
    where: { id: merchant.id },
    data: { tokenBalance: { decrement: BigInt(amount) } },
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: { pointsBalance: { increment: BigInt(amount) } },
  });

  const txHash = onChainTx?.hash || "AWARD:" + Date.now() + ":" + merchant.id + ":" + customer.id;
  await prisma.transaction.create({
    data: {
      txHash,
      type: "AWARD",
      fromAddress: onChainTx?.hash?.startsWith?.("0x") ? merchant.walletAddress : merchant.email,
      toAddress: onChainTx?.hash?.startsWith?.("0x") ? customer.walletAddress : customerEmail,
      amount: amount.toString(),
      tokenContract: merchant.tokenContract,
      merchantId: merchant.id,
      customerId: customer.id,
    },
  });

  res.json({ success: true, amount: +amount, customerEmail, onChainTx,
    customerBalance: (BigInt(customer.pointsBalance) + BigInt(amount)).toString(),
    onChainBalance: onChainBalance !== null ? (BigInt(availableBalance) - BigInt(amount)).toString() : null,
  });
});

router.get("/customers", auth, requireMerchant, async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { merchantId: req.merchant.id, type: "AWARD" },
    include: { customer: { select: { email: true, firstName: true, lastName: true, pointsBalance: true } } },
    orderBy: { createdAt: "desc" },
  });

  const customerMap = {};
  for (const tx of transactions) {
    if (!tx.customer) continue;
    const email = tx.customer.email;
    if (!customerMap[email]) {
      const fn = tx.customer.firstName || "";
      const ln = tx.customer.lastName || "";
      customerMap[email] = {
        email,
        name: [fn, ln].filter(Boolean).join(" ") || email.split("@")[0],
        totalAwarded: BigInt(0),
        pointsBalance: tx.customer.pointsBalance,
        lastAward: tx.createdAt,
      };
    }
    customerMap[email].totalAwarded += BigInt(tx.amount);
    if (tx.createdAt > customerMap[email].lastAward) {
      customerMap[email].lastAward = tx.createdAt;
    }
  }

  const customers = Object.values(customerMap).map((c) => ({
    ...c,
    totalAwarded: c.totalAwarded.toString(),
    pointsBalance: c.pointsBalance.toString(),
  }));

  res.json({ customers });
});

// Create Stripe Checkout Session
router.post("/create-checkout-session", auth, requireMerchant, async (req, res) => {
  const { amountNPR } = req.body;
  if (!amountNPR || +amountNPR <= 0) return res.status(400).json({ error: "Invalid amount" });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "npr",
          product_data: { name: "Loyalty Tokens", description: `${amountNPR} NPR worth of loyalty tokens` },
          unit_amount: +amountNPR * 100, // NPR in paisa
        },
        quantity: 1,
      }],
      success_url: `${process.env.CORS_ORIGIN || "http://localhost:5173"}/merchant/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CORS_ORIGIN || "http://localhost:5173"}/merchant/dashboard?payment=cancelled`,
      metadata: { merchantId: req.merchant.id, amountNPR: amountNPR.toString() },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Confirm Stripe checkout success and credit tokens
router.post("/checkout-success", auth, requireMerchant, async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "Session ID required" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    const merchantId = session.metadata.merchantId;
    if (merchantId !== req.merchant.id) {
      return res.status(403).json({ error: "Session doesn't belong to this merchant" });
    }

    const amountNPR = parseInt(session.metadata.amountNPR);
    const exchangeRate = req.merchant.exchangeRate || 100;
    const feeRate = req.merchant.feeRate || 5;
    const grossTokens = Math.floor((amountNPR * exchangeRate) / 100);
    const fee = Math.floor((grossTokens * feeRate) / 100);
    const netTokens = grossTokens - fee;

    const updated = await prisma.merchant.update({
      where: { id: merchantId },
      data: { tokenBalance: { increment: BigInt(netTokens) } },
    });

    // On-chain: mint ERC20 tokens to merchant wallet
    let onChainTx = null;
    if (providerReady && updated.tokenContract && updated.walletAddress) {
      try {
        onChainTx = await mintTokens(updated.tokenContract, updated.walletAddress, BigInt(netTokens));
      } catch (e) {
        console.warn("On-chain mint failed:", e.message);
      }
    }

    const txHash = onChainTx?.hash || "TOPUP:" + sessionId;
    await prisma.transaction.create({
      data: {
        txHash,
        type: "TOPUP",
        fromAddress: onChainTx?.hash?.startsWith?.("0x") ? "stripe:" + updated.walletAddress : "stripe",
        toAddress: updated.email,
        amount: netTokens.toString(),
        tokenContract: updated.tokenContract,
        merchantId,
      },
    });

    res.json({ success: true, amountNPR, grossTokens, fee, netTokens, merchant: updated, onChainTx });
  } catch (err) {
    console.error("Checkout success error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Direct top-up (admin use only, no payment)
router.post("/topup", auth, async (req, res) => {
  if (!req.merchant && !req.user?.isAdmin) return res.status(403).json({ error: "Admin or merchant only" });
  const merchant = req.merchant || await prisma.merchant.findUnique({ where: { id: req.body.merchantId } });
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });

  const { amountNPR } = req.body;
  if (!amountNPR || +amountNPR <= 0) return res.status(400).json({ error: "Invalid amount" });

  const exchangeRate = merchant.exchangeRate || 100;
  const feeRate = merchant.feeRate || 5;
  const grossTokens = Math.floor((+amountNPR * exchangeRate) / 100);
  const fee = Math.floor((grossTokens * feeRate) / 100);
  const netTokens = grossTokens - fee;

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: { tokenBalance: { increment: BigInt(netTokens) } },
  });

  // On-chain: mint ERC20 tokens to merchant wallet
  let onChainTx = null;
  if (providerReady && updated.tokenContract && updated.walletAddress) {
    try {
      onChainTx = await mintTokens(updated.tokenContract, updated.walletAddress, BigInt(netTokens));
    } catch (e) {
      console.warn("On-chain mint failed:", e.message);
    }
  }

  const txHash = onChainTx?.hash || "TOPUP:" + Date.now() + ":" + merchant.id;
  await prisma.transaction.create({
    data: {
      txHash,
      type: "TOPUP",
      fromAddress: onChainTx?.hash?.startsWith?.("0x") ? (req.user?.isAdmin ? "admin:" + updated.walletAddress : "stripe:" + updated.walletAddress) : (req.user?.isAdmin ? "admin" : "stripe"),
      toAddress: updated.email,
      amount: netTokens.toString(),
      tokenContract: updated.tokenContract,
      merchantId: merchant.id,
    },
  });

  res.json({ success: true, amountNPR: +amountNPR, grossTokens, fee, netTokens, merchant: updated, onChainTx });
});

module.exports = router;
