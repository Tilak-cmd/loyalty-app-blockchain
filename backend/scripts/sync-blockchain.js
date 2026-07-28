const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("../services/env").load(path.join(__dirname, "..", ".env"));

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const dbUrl = new URL(process.env.DATABASE_URL);
const pool = new Pool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || "5432"),
  database: dbUrl.pathname.replace(/^\//, "").split("?")[0],
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ADDRESSES_PATH = path.join(__dirname, "..", "contract-addresses.json");
const ARTIFACTS_PATH = path.join(__dirname, "artifacts.json");

const TOKEN_ABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const REGISTRY_ABI = [
  "function addMerchant(address merchant, address token) external",
  "function merchantToToken(address) view returns (address)",
];

async function main() {
  const network = process.env.SYNC_RPC_URL || process.env.RPC_URL || "http://127.0.0.1:8545";
  console.log("Connecting to:", network);
  const provider = new ethers.JsonRpcProvider(network, null, { staticNetwork: true });
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || ethers.ZeroHash, provider);

  const networkInfo = await provider.getNetwork();
  const bal = await provider.getBalance(wallet.address);
  console.log(`Network: chainId=${networkInfo.chainId}, wallet=${wallet.address}, balance=${ethers.formatEther(bal)} ETH`);

  if (bal === 0n) {
    console.error("Wallet has no ETH. Aborting.");
    process.exit(1);
  }

  const artifacts = JSON.parse(fs.readFileSync(ARTIFACTS_PATH, "utf8"));

  let addresses = {};
  try { addresses = JSON.parse(fs.readFileSync(ADDRESSES_PATH, "utf8")); } catch {}

  async function ensureContract(key, artifactName, label) {
    if (addresses[key]) {
      const code = await provider.getCode(addresses[key]);
      if (code !== "0x") {
        console.log(`  ${label} already deployed at ${addresses[key]}`);
        return addresses[key];
      }
      console.log(`  ${label} address ${addresses[key]} has no code, redeploying...`);
    }
    const art = artifacts[artifactName];
    const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`  Deployed ${label} at ${addr}`);
    addresses[key] = addr;
    fs.writeFileSync(ADDRESSES_PATH, JSON.stringify(addresses, null, 2) + "\n");
    return addr;
  }

  console.log("\n=== Step 1: Deploying core contracts ===");
  const factoryAddr = await ensureContract("factory", "factory", "LoyalFactory");
  const registryAddr = await ensureContract("registry", "registry", "MerchantRegistry");
  await ensureContract("dataRegistry", "dataRegistry", "DataRegistry");

  const factory = new ethers.Contract(factoryAddr, artifacts.factory.abi, wallet);
  const registry = new ethers.Contract(registryAddr, REGISTRY_ABI, wallet);

  console.log("\n=== Step 2: Syncing merchants ===");
  const merchants = await prisma.merchant.findMany({
    where: { kybStatus: "APPROVED" },
  });
  console.log(`Found ${merchants.length} approved merchants`);

  for (const merchant of merchants) {
    console.log(`\n  Processing: ${merchant.businessName} (${merchant.email})`);
    let tokenAddr = merchant.tokenContract;

    if (!tokenAddr && merchant.walletAddress) {
      try {
        const TOKEN_ARTIFACT = JSON.parse(fs.readFileSync(
          path.join(__dirname, "..", "..", "contracts", "artifacts", "contracts", "LoyalToken.sol", "LoyalToken.json")
        ));
        const tokenFactory = new ethers.ContractFactory(TOKEN_ARTIFACT.abi, TOKEN_ARTIFACT.bytecode, wallet);
        const tokenContract = await tokenFactory.deploy(
          `LoyalToken-${merchant.businessName.replace(/[^a-zA-Z0-9]/g, "")}`, "LYL", wallet.address
        );
        await tokenContract.waitForDeployment();
        tokenAddr = await tokenContract.getAddress();
        console.log(`    Deployed token at ${tokenAddr}`);
      } catch (e) {
        console.error(`    Failed to deploy token: ${e.message}`);
        continue;
      }
    } else if (tokenAddr) {
      const code = await provider.getCode(tokenAddr);
      if (code === "0x") {
        console.log(`    Existing tokenContract ${tokenAddr} has no code, skipping`);
        continue;
      }
      console.log(`    Existing token at ${tokenAddr}`);
    } else {
      console.log(`    No walletAddress, skipping`);
      continue;
    }

    if (merchant.walletAddress) {
      try {
        await registry.addMerchant(merchant.walletAddress, tokenAddr);
        console.log(`    Registered in registry`);
      } catch (e) {
        console.log(`    Registry registration skipped: ${e.message}`);
      }
    }

    const balance = BigInt(merchant.tokenBalance);
    if (balance > 0n) {
      try {
        const token = new ethers.Contract(tokenAddr, TOKEN_ABI, wallet);
        const onChain = await token.balanceOf(merchant.walletAddress);
        if (BigInt(onChain) >= balance) {
          console.log(`    Balance ${balance.toString()} already minted (on-chain: ${onChain.toString()})`);
        } else {
          const mintTx = await token.mint(merchant.walletAddress, balance);
          await mintTx.wait();
          console.log(`    Minted ${balance.toString()} tokens to ${merchant.walletAddress}`);
        }
      } catch (e) {
        console.error(`    Mint failed: ${e.message}`);
      }
    } else {
      console.log(`    Token balance is 0, nothing to mint`);
    }

    if (tokenAddr && tokenAddr !== merchant.tokenContract) {
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: { tokenContract: tokenAddr },
      });
      console.log(`    Updated DB with tokenContract`);
    }
  }

  console.log("\n=== Step 3: Syncing customer balances ===");
  const customers = await prisma.customer.findMany({
    where: { pointsBalance: { gt: 0 }, walletAddress: { not: null } },
  });
  console.log(`Found ${customers.length} customers with balances`);

  for (const customer of customers) {
    const custBal = BigInt(customer.pointsBalance);
    if (custBal <= 0n) continue;

    for (const merchant of merchants) {
      if (!merchant.tokenContract || !merchant.walletAddress) continue;
      const code = await provider.getCode(merchant.tokenContract);
      if (code === "0x") continue;

      try {
        const token = new ethers.Contract(merchant.tokenContract, TOKEN_ABI, wallet);
        const onChain = await token.balanceOf(customer.walletAddress);
        if (BigInt(onChain) >= custBal) continue;

        await token.mint(customer.walletAddress, custBal);
        console.log(`  Minted ${custBal.toString()} tokens for ${customer.email} from ${merchant.businessName}`);
      } catch (e) {
        console.log(`  Skipping customer sync for ${customer.email} on ${merchant.businessName}: ${e.message}`);
      }
    }
  }

  console.log("\n=== Sync complete ===");
  await prisma.$disconnect();
  pool.end();
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
