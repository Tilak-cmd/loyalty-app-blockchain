const test = require("node:test");
const assert = require("node:assert");
const prisma = require("../services/prisma");

test("merchant can be created without registration fields (validation is app-level)", async () => {
  const merchant = await prisma.merchant.create({
    data: {
      businessName: "Test Merchant",
      email: `test${Date.now()}@merchant.com`,
      privyUserId: `privy_${Date.now()}`,
      walletAddress: `0x${Date.now()}${Math.random().toString(36).slice(2, 10)}`,
      kybStatus: "PENDING",
      status: "ACTIVE",
    },
  });
  assert.ok(merchant.id);
  assert.equal(merchant.registrationNo, null);
  assert.equal(merchant.vat, null);
  assert.equal(merchant.pan, null);
  await prisma.merchant.delete({ where: { id: merchant.id } });
});

test("merchant can be created with registrationNo", async () => {
  const id = `reg_${Date.now()}`;
  const merchant = await prisma.merchant.create({
    data: {
      businessName: "Test Merchant",
      email: `reg${Date.now()}@merchant.com`,
      privyUserId: `privy_reg${Date.now()}`,
      walletAddress: `0x${Date.now()}${Math.random().toString(36).slice(2, 10)}`,
      registrationNo: "REG-12345",
      kybStatus: "PENDING",
      status: "ACTIVE",
    },
  });
  assert.ok(merchant.id);
  assert.equal(merchant.registrationNo, "REG-12345");
  assert.equal(merchant.vat, null);
  assert.equal(merchant.pan, null);
  await prisma.merchant.delete({ where: { id: merchant.id } });
});

test("merchant can be created with vat", async () => {
  const id = `vat_${Date.now()}`;
  const merchant = await prisma.merchant.create({
    data: {
      businessName: "Test Merchant",
      email: `vat${Date.now()}@merchant.com`,
      privyUserId: `privy_vat${Date.now()}`,
      walletAddress: `0x${Date.now()}${Math.random().toString(36).slice(2, 10)}`,
      vat: "VAT-123456",
      kybStatus: "PENDING",
      status: "ACTIVE",
    },
  });
  assert.ok(merchant.id);
  assert.equal(merchant.vat, "VAT-123456");
  await prisma.merchant.delete({ where: { id: merchant.id } });
});

test("merchant can be created with pan", async () => {
  const id = `pan_${Date.now()}`;
  const merchant = await prisma.merchant.create({
    data: {
      businessName: "Test Merchant",
      email: `pan${Date.now()}@merchant.com`,
      privyUserId: `privy_pan${Date.now()}`,
      walletAddress: `0x${Date.now()}${Math.random().toString(36).slice(2, 10)}`,
      pan: "PAN-789012",
      kybStatus: "PENDING",
      status: "ACTIVE",
    },
  });
  assert.ok(merchant.id);
  assert.equal(merchant.pan, "PAN-789012");
  await prisma.merchant.delete({ where: { id: merchant.id } });
});

test("merchant can have all three registration fields", async () => {
  const merchant = await prisma.merchant.create({
    data: {
      businessName: "Test Merchant",
      email: `all${Date.now()}@merchant.com`,
      privyUserId: `privy_all${Date.now()}`,
      walletAddress: `0x${Date.now()}${Math.random().toString(36).slice(2, 10)}`,
      registrationNo: "REG-001",
      vat: "VAT-001",
      pan: "PAN-001",
      kybStatus: "PENDING",
      status: "ACTIVE",
    },
  });
  assert.ok(merchant.id);
  assert.equal(merchant.registrationNo, "REG-001");
  assert.equal(merchant.vat, "VAT-001");
  assert.equal(merchant.pan, "PAN-001");
  await prisma.merchant.delete({ where: { id: merchant.id } });
});
