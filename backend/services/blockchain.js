const { ethers } = require("ethers");

const TOKEN_ABI = [
  "function mint(address to, uint256 amount) external",
  "function burn(uint256 amount) external",
  "function burnFrom(address account, uint256 amount) external",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const FACTORY_ABI = [
  "function createToken(string memory name, string memory symbol, address merchant) external returns (address)",
  "event TokenDeployed(address indexed merchant, address tokenAddress, string name, string symbol)",
];

const REGISTRY_ABI = [
  "function addMerchant(address merchant, address token) external",
  "function isMerchant(address) view returns (bool)",
  "function merchantToToken(address) view returns (address)",
];

const DATA_REGISTRY_ABI = [
  "function setDataHash(address user, bytes32 hash) external",
  "function getDataHash(address user) view returns (bytes32)",
  "function setKycHash(address merchant, bytes32 hash) external",
  "function getKycHash(address merchant) view returns (bytes32)",
];

let provider, wallet, providerReady = false, addresses = {};
try {
  addresses = require("fs").existsSync(__dirname + "/../contract-addresses.json")
    ? JSON.parse(require("fs").readFileSync(__dirname + "/../contract-addresses.json", "utf8"))
    : {};
} catch {}

let MOCK_MODE = process.env.BLOCKCHAIN_MOCK === "true";

try {
  provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545", null, { batchMaxCount: 1 });
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY || ethers.ZeroHash, provider);
  providerReady = true;
} catch (e) {
  console.warn("Blockchain RPC unavailable, enabling mock mode:", e.message);
  MOCK_MODE = true;
}

if (MOCK_MODE) providerReady = true;

let _nonceCache = null;

async function getFreshNonce() {
  if (!provider) return 0;
  if (_nonceCache === null) {
    _nonceCache = Number(await provider.getTransactionCount(wallet.address, "latest"));
  }
  const nonce = _nonceCache;
  _nonceCache++;
  return nonce;
}

function mockTx() {
  if (!MOCK_MODE) throw new Error("Blockchain provider not available. Set BLOCKCHAIN_MOCK=true to run in mock mode.");
  const short = Date.now().toString(16).padStart(40, "0").slice(-40);
  return { hash: "0x" + short, mock: true };
}

async function deployTokenForMerchant(merchantAddr, name, symbol) {
  if (!addresses?.factory || !providerReady) {
    if (MOCK_MODE) return "0x" + Date.now().toString(16).padStart(64, "0").slice(-64);
    throw new Error("Blockchain provider not ready for token deployment");
  }
  try {
    const factory = new ethers.Contract(addresses.factory, FACTORY_ABI, wallet);
    const tx = await factory.createToken(name, symbol, merchantAddr);
    const receipt = await tx.wait();
    const tokenDeployedTopic = ethers.id("TokenDeployed(address,address,string,string)");
    const eventLog = receipt.logs.find(l => l.topics?.[0] === tokenDeployedTopic);
    if (eventLog) {
      const parsed = factory.interface.parseLog({ topics: eventLog.topics, data: eventLog.data });
      return parsed?.args?.tokenAddress || "0x" + Date.now().toString(16).padStart(64, "0").slice(-64);
    }
    throw new Error("Token deployment event not found");
  } catch (e) {
    if (MOCK_MODE) return "0x" + Date.now().toString(16).padStart(64, "0").slice(-64);
    throw e;
  }
}

async function addMerchantToRegistry(merchantAddr, tokenAddr) {
  if (!addresses?.registry) return mockTx();
  const registry = new ethers.Contract(addresses.registry, REGISTRY_ABI, wallet);
  return (await registry.addMerchant(merchantAddr, tokenAddr)).wait();
}

async function mintTokens(tokenAddr, to, amount) {
  if (!provider || !providerReady) return mockTx();
  const token = new ethers.Contract(tokenAddr, TOKEN_ABI, wallet);
  const nonce = await getFreshNonce();
  return (await token.mint(to, amount, { nonce })).wait();
}

async function burnTokens(tokenAddr, amount) {
  if (!provider || !providerReady) return mockTx();
  const token = new ethers.Contract(tokenAddr, TOKEN_ABI, wallet);
  const nonce = await getFreshNonce();
  return (await token.burn(amount, { nonce })).wait();
}

async function burnFromCustomer(tokenAddr, account, amount) {
  if (!provider || !providerReady) return mockTx();
  const token = new ethers.Contract(tokenAddr, TOKEN_ABI, wallet);
  const nonce = await getFreshNonce();
  return (await token.burnFrom(account, amount, { nonce })).wait();
}

async function ensureOnChainBalance(tokenContract, address, dbBalance) {
  if (!providerReady || !tokenContract || !address) return null;
  try {
    const onChain = BigInt(await getBalance(tokenContract, address));
    if (onChain !== BigInt(dbBalance)) {
      const diff = BigInt(dbBalance) - onChain;
      if (diff > 0n) {
        await mintTokens(tokenContract, address, diff);
        return { synced: true, onChain: (onChain + diff).toString(), action: "minted", diff: diff.toString() };
      } else if (diff < 0n) {
        const absDiff = -diff;
        await burnFromCustomer(tokenContract, address, absDiff);
        return { synced: true, onChain: (onChain + diff).toString(), action: "burned", diff: absDiff.toString() };
      }
    }
    return { synced: true, onChain: dbBalance, action: "match" };
  } catch (e) {
    console.warn("Auto-sync failed:", e.message);
    return null;
  }
}

async function getBalance(tokenAddr, address) {
  if (!provider || !providerReady) return "0";
  if (!ethers.isAddress(tokenAddr) || !ethers.isAddress(address)) return "0";
  try {
    const token = new ethers.Contract(tokenAddr, TOKEN_ABI, provider);
    return (await token.balanceOf(address)).toString();
  } catch { return "0"; }
}

async function storeDataHash(userAddress, hash) {
  if (!addresses?.dataRegistry || !providerReady) {
    if (MOCK_MODE) return { hash: "0x" + Date.now().toString(16).padStart(64, "0").slice(-64), mock: true };
    throw new Error("Blockchain provider not ready for storeDataHash");
  }
  const registry = new ethers.Contract(addresses.dataRegistry, DATA_REGISTRY_ABI, wallet);
  return (await registry.setDataHash(userAddress, hash)).wait();
}

async function getDataHash(userAddress) {
  if (!addresses?.dataRegistry || !providerReady) return null;
  try {
    const registry = new ethers.Contract(addresses.dataRegistry, DATA_REGISTRY_ABI, provider);
    const hash = await registry.getDataHash(userAddress);
    return hash !== ethers.ZeroHash ? hash : null;
  } catch { return null; }
}

async function storeKycHash(merchantAddress, hash) {
  if (!addresses?.dataRegistry || !providerReady) {
    if (MOCK_MODE) return { hash: "0x" + Date.now().toString(16).padStart(64, "0").slice(-64), mock: true };
    throw new Error("Blockchain provider not ready for storeKycHash");
  }
  const registry = new ethers.Contract(addresses.dataRegistry, DATA_REGISTRY_ABI, wallet);
  return (await registry.setKycHash(merchantAddress, hash)).wait();
}

async function getKycHash(merchantAddress) {
  if (!addresses?.dataRegistry || !providerReady) return null;
  try {
    const registry = new ethers.Contract(addresses.dataRegistry, DATA_REGISTRY_ABI, provider);
    const hash = await registry.getKycHash(merchantAddress);
    return hash !== ethers.ZeroHash ? hash : null;
  } catch { return null; }
}

const CHAIN_EXPLORERS = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
  31337: null, // local — no explorer
};

const NETWORK_NAMES = {
  1: "Ethereum Mainnet",
  5: "Goerli Testnet",
  11155111: "Sepolia Testnet",
  137: "Polygon Mainnet",
  80001: "Mumbai Testnet",
  31337: "Localhost (Hardhat)",
};

let cachedChainId = null;

async function getChainId() {
  if (cachedChainId !== null) return cachedChainId;
  try {
    const network = await provider.getNetwork();
    cachedChainId = Number(network.chainId);
    return cachedChainId;
  } catch { return null; }
}

async function getNetworkName() {
  const chainId = await getChainId();
  return NETWORK_NAMES[chainId] || `Chain ID ${chainId}`;
}

async function getExplorerUrl() {
  const chainId = await getChainId();
  return CHAIN_EXPLORERS[chainId] || null;
}

async function getBlockNumber() {
  if (!provider || !providerReady) return null;
  try { return Number(await provider.getBlockNumber()); }
  catch { return null; }
}

function getContractAddresses() {
  return addresses;
}

function getRpcUrl() {
  return process.env.RPC_URL || "http://127.0.0.1:8545";
}

module.exports = {
  deployTokenForMerchant, addMerchantToRegistry,
  mintTokens, burnTokens, burnFromCustomer, getBalance,
  storeDataHash, getDataHash, storeKycHash, getKycHash,
  providerReady, getChainId, getNetworkName, getExplorerUrl,
  getBlockNumber, getContractAddresses, getRpcUrl,
  ensureOnChainBalance,
};
