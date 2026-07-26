const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { sign } = require("../services/jwt");

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

const TOKEN_ABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address account) view returns (uint256)",
];

const REGISTRY_ABI = [
  "function addMerchant(address merchant, address token) external",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545", null, { staticNetwork: true });
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || ethers.ZeroHash, provider);
  const network = await provider.getNetwork();
  const bal = await provider.getBalance(wallet.address);
  console.log(`Network: ${network.chainId}, Wallet: ${wallet.address}, Balance: ${ethers.formatEther(bal)} ETH`);

  const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "contract-addresses.json"), "utf8"));
  const factoryAddr = addresses.factory;
  if (!factoryAddr) { console.error("No factory address"); process.exit(1); }

  const FACTORY_ABI = [
    "function createToken(string memory name, string memory symbol, address merchant) external returns (address)",
    "event TokenDeployed(address indexed merchant, address tokenAddress, string name, string symbol)",
  ];
  const factory = new ethers.Contract(factoryAddr, FACTORY_ABI, wallet);
  const registry = new ethers.Contract(addresses.registry, REGISTRY_ABI, wallet);

  // 1. Create admin user
  const adminEmail = "s.khatiwada.7607@westcliff.edu";
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: { email: adminEmail, name: "Admin", isAdmin: true, privyUserId: "admin-" + Date.now() },
    });
    console.log("Created admin:", admin.email);
  } else {
    console.log("Admin exists:", admin.email);
  }

  // 2. Create test merchant
  const merchantEmail = "ksandresh1@gmail.com";
  let merchant = await prisma.merchant.findUnique({ where: { email: merchantEmail } });

  if (!merchant) {
    merchant = await prisma.merchant.create({
      data: {
        businessName: "Chia Pasal",
        email: merchantEmail,
        privyUserId: "merchant-" + Date.now(),
        walletAddress: wallet.address,
        kybStatus: "APPROVED",
        exchangeRate: 100,
        feeRate: 5,
        tokenBalance: BigInt(5000),
      },
    });
    console.log("Created merchant:", merchant.businessName);
  } else {
    console.log("Merchant exists:", merchant.businessName, "status:", merchant.kybStatus);
  }

  // 3. Deploy token if needed
  let tokenAddr = merchant.tokenContract;
  if (!tokenAddr || tokenAddr === ethers.ZeroHash) {
    const TOKEN_ARTIFACT = JSON.parse(fs.readFileSync(
      path.join(__dirname, "..", "..", "contracts", "artifacts", "contracts", "LoyalToken.sol", "LoyalToken.json")
    ));
    const tokenFactory = new ethers.ContractFactory(TOKEN_ARTIFACT.abi, TOKEN_ARTIFACT.bytecode, wallet);
    const tokenContract = await tokenFactory.deploy(
      `LoyalToken-${merchant.businessName.replace(/[^a-zA-Z0-9]/g, "")}`, "LYL", wallet.address
    );
    await tokenContract.waitForDeployment();
    tokenAddr = await tokenContract.getAddress();
    console.log("Deployed token at:", tokenAddr);

    try {
      await registry.addMerchant(wallet.address, tokenAddr);
      console.log("Registered in registry");
    } catch (e) {
      console.log("Registry registration skipped:", e.message);
    }

    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { tokenContract: tokenAddr },
    });
    merchant.tokenContract = tokenAddr;
  } else {
    console.log("Token exists:", tokenAddr);
  }

  // 4. Mint tokens to merchant
  const token = new ethers.Contract(tokenAddr, TOKEN_ABI, wallet);
  const nonce = await provider.getTransactionCount(wallet.address);
  const onChain = await token.balanceOf(wallet.address);
  const dbBalance = BigInt(merchant.tokenBalance);
  if (onChain < dbBalance) {
    const mintAmt = dbBalance - onChain;
    await (await token.mint(wallet.address, mintAmt, { nonce })).wait();
    console.log(`Minted ${mintAmt.toString()} extra tokens (total: ${dbBalance.toString()})`);
  } else {
    console.log(`Tokens already minted: ${onChain.toString()}`);
  }

  // 5. Ensure test customer exists with wallet
  const custEmail = "sandeshnilaskhatwada@gmail.com";
  let customer = await prisma.customer.findUnique({ where: { email: custEmail } });
  const custWallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        email: custEmail,
        firstName: "Sandesh",
        lastName: "Khatiwada",
        privyUserId: "cust-" + Date.now(),
        walletAddress: custWallet,
        pointsBalance: BigInt(135),
        isActive: true,
      },
    });
    console.log("Created customer:", customer.email);
  } else {
    if (!customer.walletAddress) {
      await prisma.customer.update({ where: { id: customer.id }, data: { walletAddress: custWallet } });
      console.log("Updated customer wallet");
    }
    console.log("Customer exists:", customer.email);
  }

  // 6. Award points to customer from merchant (mint on-chain)
  const custOnChain = await token.balanceOf(custWallet);
  const custDb = BigInt(customer.pointsBalance);
  if (custOnChain < custDb) {
    const awardAmt = custDb - custOnChain;
    const nonce2 = await provider.getTransactionCount(wallet.address);
    await (await token.mint(custWallet, awardAmt, { nonce: nonce2 })).wait();
    console.log(`Minted ${awardAmt.toString()} tokens for customer`);
  } else {
    console.log(`Customer already has ${custOnChain.toString()} on-chain`);
  }

  // 7. Create a product
  let product = await prisma.product.findFirst({ where: { merchantId: merchant.id } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        merchantId: merchant.id,
        name: "Coffee Voucher",
        description: "Redeem for a free coffee at Chia Pasal",
        tokenPrice: BigInt(50),
        isActive: true,
      },
    });
    await prisma.product.create({
      data: {
        merchantId: merchant.id,
        name: "Tea Sampler Pack",
        description: "A pack of 5 premium teas",
        tokenPrice: BigInt(100),
        isActive: true,
      },
    });
    console.log("Created products");
  } else {
    console.log("Products exist");
  }

  // 8. Generate tokens
  const merchantToken = sign({ merchantId: merchant.id, email: merchant.email, type: "merchant" });
  const adminToken = sign({ userId: admin.id, email: admin.email, isAdmin: true, type: "admin" });

  console.log("\n=== BOOTSTRAP COMPLETE ===");
  console.log("\n--- Auth Tokens ---");
  console.log("Admin:", adminToken);
  console.log("Merchant:", merchantToken);
  console.log("\n--- Summary ---");
  console.log(`Merchant: ${merchant.businessName} (${merchant.email})`);
  console.log(`Token Contract: ${tokenAddr}`);
  console.log(`Merchant Balance: ${dbBalance.toString()} pts`);
  console.log(`Customer: ${customer.email} — ${custDb.toString()} pts`);

  await prisma.$disconnect();
  pool.end();
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
