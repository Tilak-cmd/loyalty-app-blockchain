const router = require("express").Router();
const {
  getChainId, getNetworkName, getExplorerUrl, getBlockNumber,
  getContractAddresses, getRpcUrl, providerReady,
} = require("../services/blockchain");

router.get("/info", async (req, res) => {
  const [chainId, networkName, explorerUrl, blockNumber] = await Promise.all([
    getChainId(), getNetworkName(), getExplorerUrl(), getBlockNumber(),
  ]);
  res.json({ chainId, networkName, explorerUrl, blockNumber, providerReady, rpcUrl: getRpcUrl() });
});

router.get("/admin-wallet", async (req, res) => {
  const adminWallet = (process.env.ADMIN_WALLETS || "").split(",")[0]?.trim() || null;
  res.json({ adminWallet, providerReady });
});

router.get("/contracts", async (req, res) => {
  res.json({ contracts: getContractAddresses(), providerReady });
});

module.exports = router;
