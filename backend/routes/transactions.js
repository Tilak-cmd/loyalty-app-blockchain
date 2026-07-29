const router = require("express").Router();
const prisma = require("../services/prisma");
const auth = require("../middleware/auth");

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: "Admin only" });
  next();
}

const txInclude = {
  merchant: { select: { id: true, businessName: true, email: true } },
  customer: { select: { id: true, email: true, firstName: true, lastName: true } },
  product: { select: { id: true, name: true } },
};

router.get("/", auth, async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  let where = {};
  if (req.customer) where = { customerId: req.customer.id };
  else if (req.merchant) where = { merchantId: req.merchant.id };
  else if (req.user?.isAdmin) where = {};

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(parseInt(limit), 100),
      skip: parseInt(offset),
      include: txInclude,
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({ transactions, total, limit: parseInt(limit), offset: parseInt(offset) });
});

router.get("/all", auth, requireAdmin, async (req, res) => {
  const { limit = 50, offset = 0, type, merchantId } = req.query;

  const where = {};
  if (type) where.type = type;
  if (merchantId) where.merchantId = merchantId;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(parseInt(limit), 200),
      skip: parseInt(offset),
      include: txInclude,
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({ transactions, total, limit: parseInt(limit), offset: parseInt(offset) });
});

router.get("/:walletAddress", auth, async (req, res) => {
  const { walletAddress } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const isOwner = req.customer?.walletAddress === walletAddress || req.merchant?.walletAddress === walletAddress;
  if (!isOwner && !req.user?.isAdmin) return res.status(403).json({ error: "Access denied" });

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { OR: [{ fromAddress: walletAddress }, { toAddress: walletAddress }] },
      orderBy: { createdAt: "desc" },
      take: Math.min(parseInt(limit), 100),
      skip: parseInt(offset),
      include: txInclude,
    }),
    prisma.transaction.count({
      where: { OR: [{ fromAddress: walletAddress }, { toAddress: walletAddress }] },
    }),
  ]);

  res.json({ transactions, total, limit: parseInt(limit), offset: parseInt(offset) });
});

module.exports = router;
