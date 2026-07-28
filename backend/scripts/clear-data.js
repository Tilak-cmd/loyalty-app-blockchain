const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("../services/env").load();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Delete in order respecting foreign key constraints
  await prisma.platformRevenue.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.pendingAward.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.user.deleteMany();

  console.log("All data cleared. Tables are empty.");
  await prisma.$disconnect();
  pool.end();
}

main().catch((e) => { console.error("Error:", e); process.exit(1); });
