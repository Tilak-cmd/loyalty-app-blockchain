const router = require("express").Router();
const prisma = require("../services/prisma");

// Public: list approved merchants
router.get("/public", async (req, res) => {
  const merchants = await prisma.merchant.findMany({
    where: { kybStatus: "APPROVED" },
    select: {
      id: true,
      businessName: true,
      email: true,
      logo: true,
      country: true,
      currency: true,
    },
    orderBy: { businessName: "asc" },
  });
  res.json({ merchants });
});

// Public: list active products for a merchant
router.get("/public/:merchantId/products", async (req, res) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: req.params.merchantId },
    select: { id: true, businessName: true, kybStatus: true },
  });
  if (!merchant || merchant.kybStatus !== "APPROVED") {
    return res.status(404).json({ error: "Merchant not found" });
  }
  const products = await prisma.product.findMany({
    where: { merchantId: req.params.merchantId, isActive: true },
    select: { id: true, name: true, description: true, imageUrl: true, tokenPrice: true },
    orderBy: { name: "asc" },
  });
  res.json({ merchant: { id: merchant.id, businessName: merchant.businessName }, products });
});

module.exports = router;
