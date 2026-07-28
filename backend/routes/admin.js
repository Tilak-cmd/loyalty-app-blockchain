const router = require("express").Router();
const { ethers } = require("ethers");
const prisma = require("../services/prisma");
const blockchain = require("../services/blockchain");
const auth = require("../middleware/auth");

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: "Admin only" });
  next();
}

// Get pending merchants
router.get("/merchants/pending", auth, requireAdmin, async (req, res) => {
  const merchants = await prisma.merchant.findMany({
    where: { kybStatus: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  res.json({ merchants });
});

// Approve merchant
router.patch("/merchants/:id/approve", auth, requireAdmin, async (req, res) => {
  const merchant = await prisma.merchant.findUnique({ where: { id: req.params.id } });
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });
  if (merchant.kybStatus === "APPROVED") return res.status(400).json({ error: "Already approved" });

  const symbol = (merchant.businessName || "TKN").slice(0, 5).toUpperCase();
  const name = `${merchant.businessName} Token`;

  let tokenAddr = null;
  try {
    tokenAddr = await blockchain.deployTokenForMerchant(merchant.walletAddress || "0x0", name, symbol);
  } catch (e) {
    console.warn("Token deploy failed (mock mode):", e.message);
  }

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      kybStatus: "APPROVED",
      tokenContract: tokenAddr,
      isVerified: true,
    },
  });

  res.json({ success: true, merchant: updated });
});

// Reject merchant
router.patch("/merchants/:id/reject", auth, requireAdmin, async (req, res) => {
  const updated = await prisma.merchant.update({
    where: { id: req.params.id },
    data: { kybStatus: "REJECTED" },
  });
  res.json({ success: true, merchant: updated });
});

// Get all merchants
router.get("/merchants", auth, requireAdmin, async (req, res) => {
  const merchants = await prisma.merchant.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ merchants });
});

// Buy tokens for a merchant (admin)
router.post("/merchants/:id/topup", auth, requireAdmin, async (req, res) => {
  const { amountNPR } = req.body;
  if (!amountNPR || +amountNPR <= 0) return res.status(400).json({ error: "Invalid amount" });

  const merchant = await prisma.merchant.findUnique({ where: { id: req.params.id } });
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });

  const exchangeRate = merchant.exchangeRate || 100;
  const feeRate = merchant.feeRate || 5;
  const grossTokens = Math.floor((+amountNPR * exchangeRate) / 100);
  const fee = Math.floor((grossTokens * feeRate) / 100);
  const netTokens = grossTokens - fee;

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: { tokenBalance: { increment: BigInt(netTokens) } },
  });

  const txHash = "TOPUP:" + Date.now() + ":" + merchant.id;
  await prisma.transaction.create({
    data: {
      txHash,
      type: "TOPUP",
      fromAddress: "admin",
      toAddress: merchant.email,
      amount: netTokens.toString(),
      grossTokens: BigInt(grossTokens),
      feeTokens: BigInt(fee),
      tokenContract: updated.tokenContract,
      merchantId: merchant.id,
    },
  });

  // Persist platform fee as revenue
  await prisma.platformRevenue.create({
    data: {
      type: "TOPUP_FEE",
      amountNPR: BigInt(+amountNPR),
      tokenAmount: BigInt(fee),
      currency: "NPR",
      merchantId: merchant.id,
      memo: `Admin topup: ${amountNPR} NPR (${fee} tokens fee at ${feeRate}%)`,
    },
  });

  // On-chain: mint ERC20 tokens to merchant wallet + fee to admin wallet
  let onChainTx = null;
  const adminWallet = (process.env.ADMIN_WALLETS || "").split(",")[0]?.trim();
  if (blockchain.providerReady && updated.tokenContract && updated.walletAddress) {
    onChainTx = await blockchain.mintTokens(updated.tokenContract, updated.walletAddress, BigInt(netTokens));
    if (fee > 0 && adminWallet && adminWallet !== updated.walletAddress) {
      await blockchain.mintTokens(updated.tokenContract, adminWallet, BigInt(fee));
    }
  }

  res.json({ success: true, netTokens, fee, amountNPR: +amountNPR, merchant: updated, onChainTx });
});

// Get stats
router.get("/stats", auth, requireAdmin, async (req, res) => {
  const [totalMerchants, approvedMerchants, pendingMerchants, totalCustomers, totalTransactions, revenueAgg] = await Promise.all([
    prisma.merchant.count(),
    prisma.merchant.count({ where: { kybStatus: "APPROVED" } }),
    prisma.merchant.count({ where: { kybStatus: "PENDING" } }),
    prisma.customer.count(),
    prisma.transaction.count(),
    prisma.platformRevenue.aggregate({ _sum: { tokenAmount: true, amountNPR: true } }),
  ]);

  const totalRevenueTokens = revenueAgg._sum.tokenAmount?.toString() || "0";
  const totalRevenueNPR = revenueAgg._sum.amountNPR?.toString() || "0";

  res.json({
    stats: {
      totalMerchants,
      approvedMerchants,
      pendingMerchants,
      totalCustomers,
      totalTransactions,
      totalRevenueTokens,
      totalRevenueNPR,
    },
  });
});

// Revenue breakdown
router.get("/revenue", auth, requireAdmin, async (req, res) => {
  const [byMerchant, daily, recent] = await Promise.all([
    // Per-merchant revenue
    prisma.platformRevenue.groupBy({
      by: ["merchantId"],
      _sum: { tokenAmount: true, amountNPR: true },
      _count: true,
      orderBy: { _sum: { tokenAmount: "desc" } },
    }),
    // Daily revenue (last 30 days)
    prisma.platformRevenue.groupBy({
      by: ["createdAt"],
      _sum: { tokenAmount: true, amountNPR: true },
      _count: true,
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
    }),
    // Recent revenue entries
    prisma.platformRevenue.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { merchant: { select: { businessName: true, email: true } } },
    }),
  ]);

  // Enrich per-merchant with business names
  const merchantIds = byMerchant.map((r) => r.merchantId).filter(Boolean);
  const merchants = merchantIds.length
    ? await prisma.merchant.findMany({ where: { id: { in: merchantIds } }, select: { id: true, businessName: true } })
    : [];
  const merchantMap = Object.fromEntries(merchants.map((m) => [m.id, m.businessName]));

  res.json({
    byMerchant: byMerchant.map((r) => ({
      merchantId: r.merchantId,
      businessName: merchantMap[r.merchantId] || "Unknown",
      totalTokens: r._sum.tokenAmount?.toString() || "0",
      totalNPR: r._sum.amountNPR?.toString() || "0",
      count: r._count,
    })),
    daily: daily.map((r) => ({
      date: r.createdAt,
      tokens: r._sum.tokenAmount?.toString() || "0",
      npr: r._sum.amountNPR?.toString() || "0",
      count: r._count,
    })),
    recent: recent.map((r) => ({
      id: r.id,
      type: r.type,
      tokenAmount: r.tokenAmount?.toString() || "0",
      amountNPR: r.amountNPR?.toString() || "0",
      currency: r.currency,
      merchantName: r.merchant?.businessName || null,
      memo: r.memo,
      createdAt: r.createdAt,
    })),
  });
});

module.exports = router;
