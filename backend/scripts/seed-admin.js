const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("../services/env").load();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const adminEmail = process.env.ADMIN_EMAIL || "s.khatiwada.7607@westcliff.edu";

  let user = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: adminEmail, name: "Admin", isAdmin: true, status: "ACTIVE" },
    });
    console.log("Admin user created:", user.email);
  } else {
    user = await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true, status: "ACTIVE" } });
    console.log("Admin user updated:", user.email);
  }

  await prisma.$disconnect();
  pool.end();
  console.log("Admin seed complete.");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
