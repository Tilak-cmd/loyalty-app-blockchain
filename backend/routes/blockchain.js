const router = require("express").Router();
const { getChainId, getExplorerUrl, providerReady } = require("../services/blockchain");

router.get("/info", async (req, res) => {
  const chainId = await getChainId();
  const explorer = await getExplorerUrl();
  res.json({ chainId, explorerUrl: explorer, providerReady });
});

module.exports = router;
