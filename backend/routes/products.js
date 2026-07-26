const router = require("express").Router();
const prisma = require("../services/prisma");
const auth = require("../middleware/auth");

function requireMerchant(req, res, next) {
  if (!req.merchant) return res.status(403).json({ error: "Merchant account required" });
  next();
}

// List my products
router.get("/", auth, requireMerchant, async (req, res) => {
  const products = await prisma.product.findMany({
    where: { merchantId: req.merchant.id },
    orderBy: { createdAt: "desc" },
  });
  res.json({ products });
});

// Create product
router.post("/", auth, requireMerchant, async (req, res) => {
  const { name, description, imageUrl, tokenPrice } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Product name is required" });
  if (!tokenPrice || parseInt(tokenPrice) <= 0) return res.status(400).json({ error: "Token price must be positive" });

  const product = await prisma.product.create({
    data: {
      merchantId: req.merchant.id,
      name: name.trim(),
      description: description?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
      tokenPrice: BigInt(tokenPrice),
    },
  });
  res.json({ product });
});

// Update product
router.put("/:id", auth, requireMerchant, async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.merchantId !== req.merchant.id) {
    return res.status(404).json({ error: "Product not found" });
  }
  const { name, description, imageUrl, tokenPrice, isActive } = req.body;
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
      ...(tokenPrice !== undefined && { tokenPrice: BigInt(tokenPrice) }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  res.json({ product });
});

// Delete product
router.delete("/:id", auth, requireMerchant, async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.merchantId !== req.merchant.id) {
    return res.status(404).json({ error: "Product not found" });
  }
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;
