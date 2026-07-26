// Sync DB balances with on-chain source of truth
// Usage: node scripts/sync-balances.js

const prisma = require("../services/prisma");
const { getBalance } = require("../services/blockchain");

async function main() {
  console.log("=== Syncing merchant balances ===");
  const merchants = await prisma.merchant.findMany({
    where: { tokenContract: { not: null }, walletAddress: { not: null } },
  });
  for (const m of merchants) {
    try {
      const onChain = await getBalance(m.tokenContract, m.walletAddress);
      const dbBalance = m.tokenBalance.toString();
      if (onChain !== dbBalance) {
        console.log(`Merchant ${m.businessName} (${m.email}): DB=${dbBalance}, on-chain=${onChain} → updating DB`);
        await prisma.merchant.update({
          where: { id: m.id },
          data: { tokenBalance: BigInt(onChain) },
        });
      } else {
        console.log(`Merchant ${m.businessName}: ✅ match (${dbBalance})`);
      }
    } catch (e) {
      console.warn(`Merchant ${m.email} sync failed:`, e.message);
    }
  }

  console.log("\n=== Syncing customer balances ===");
  const customers = await prisma.customer.findMany({
    where: { walletAddress: { not: null } },
  });
  const approvedMerchants = await prisma.merchant.findMany({
    where: { kybStatus: "APPROVED", tokenContract: { not: null } },
    select: { tokenContract: true },
  });
  for (const c of customers) {
    try {
      let total = BigInt(0);
      for (const m of approvedMerchants) {
        const bal = await getBalance(m.tokenContract, c.walletAddress);
        total += BigInt(bal);
      }
      const onChain = total.toString();
      const dbBalance = c.pointsBalance.toString();
      if (onChain !== dbBalance) {
        console.log(`Customer ${c.email}: DB=${dbBalance}, on-chain=${onChain} → updating DB`);
        await prisma.customer.update({
          where: { id: c.id },
          data: { pointsBalance: BigInt(onChain) },
        });
      } else {
        console.log(`Customer ${c.email}: ✅ match (${dbBalance})`);
      }
    } catch (e) {
      console.warn(`Customer ${c.email} sync failed:`, e.message);
    }
  }

  console.log("\n=== Sync complete ===");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
