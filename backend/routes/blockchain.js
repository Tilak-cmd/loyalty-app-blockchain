const router = require("express").Router();
const { getChainId, getExplorerUrl, providerReady } = require("../services/blockchain");

router.get("/info", async (req, res) => {
  const chainId = await getChainId();
  const explorer = await getExplorerUrl();
  res.json({ chainId, explorerUrl: explorer, providerReady });
});

router.get("/admin-wallet", async (req, res) => {
  const wallet = (process.env.ADMIN_WALLETS || "").split(",")[0]?.trim() || null;
  res.json({ adminWallet: wallet, providerReady });
});

module.exports = router;
