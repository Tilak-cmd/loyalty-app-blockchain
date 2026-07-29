const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { ethers } = require("ethers");
const prisma = require("../services/prisma");
const { sign } = require("../services/jwt");
const { jwtVerify, createRemoteJWKSet, errors } = require("jose");

const privyJWKS = createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${process.env.PRIVY_APP_ID}/jwks.json`));

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function isCompactJWS(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

async function verifyPrivyToken(privyToken) {
  if (!isCompactJWS(privyToken)) throw new Error("Not a compact JWS");
  try {
    const { payload } = await jwtVerify(privyToken, privyJWKS, { issuer: "privy.io", audience: process.env.PRIVY_APP_ID });
    return payload;
  } catch (e) {
    try {
      const { payload } = await jwtVerify(privyToken, privyJWKS, { issuer: "https://auth.privy.io/", audience: process.env.PRIVY_APP_ID });
      return payload;
    } catch (e2) {
      const { payload } = await jwtVerify(privyToken, privyJWKS, { issuer: "https://auth.privy.io", audience: process.env.PRIVY_APP_ID });
      return payload;
    }
  }
}

// Merchant registration via Privy
router.post("/merchant/register", upload.fields([{ name: "logo", maxCount: 1 }]), async (req, res) => {
  try {
    const { token: privyToken, businessName, legalBusinessName, phone, country, currency, website, registrationNo, vat, pan, email: bodyEmail } = req.body;
    if (!privyToken) return res.status(400).json({ error: "Auth token required" });
    if (!businessName) return res.status(400).json({ error: "Business name is required" });
    if (!registrationNo && !vat && !pan) {
      return res.status(400).json({ error: "At least one of Company Registration Number, VAT, or PAN is required" });
    }

    const payload = await verifyPrivyToken(privyToken);
    const email = payload.email || bodyEmail || null;
    if (!email) return res.status(400).json({ error: "Email required from Privy" });

    const existing = await prisma.merchant.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Merchant already registered with this email" });

    const logo = req.files?.logo?.[0]?.filename || null;

    const walletAddr = payload.wallet || payload.wallets?.[0]?.address || ethers.Wallet.createRandom().address;

    const merchant = await prisma.merchant.create({
      data: {
        businessName,
        legalBusinessName: legalBusinessName || null,
        email,
        phone: phone || null,
        registrationNo: registrationNo || null,
        vat: vat || null,
        pan: pan || null,
        privyUserId: payload.sub,
        walletAddress: walletAddr,
        country: country || null,
        currency: currency || null,
        website: website || null,
        logo,
        kybStatus: "PENDING",
        status: "ACTIVE",
      },
    });

    const token = sign({ merchantId: merchant.id, email: merchant.email, type: "merchant" });
    res.json({ token, merchant });
  } catch (err) {
    console.error("Merchant register error:", err);
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

// Merchant login via Privy
router.post("/merchant/login", async (req, res) => {
  try {
    const { token: privyToken, email: bodyEmail } = req.body;
    if (!privyToken) return res.status(400).json({ error: "Token required" });

    const payload = await verifyPrivyToken(privyToken);
    const email = payload.email || bodyEmail || null;

    let merchant = await prisma.merchant.findUnique({ where: { privyUserId: payload.sub } });
    if (!merchant && email) {
      merchant = await prisma.merchant.findUnique({ where: { email } });
    }
    if (!merchant) return res.status(404).json({ error: "Merchant not found. Please register first." });
    if (merchant.status !== "ACTIVE") return res.status(403).json({ error: "Account not active" });

    merchant = await prisma.merchant.update({ where: { id: merchant.id }, data: { lastLoginAt: new Date() } });

    const token = sign({ merchantId: merchant.id, email: merchant.email, type: "merchant" });
    res.json({ token, merchant });
  } catch (err) {
    console.error("Merchant login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Admin login via Privy
router.post("/admin/login", async (req, res) => {
  try {
    const { token: privyToken, email: bodyEmail } = req.body;
    if (!privyToken) return res.status(400).json({ error: "Token required" });

    const payload = await verifyPrivyToken(privyToken);
    const email = payload.email || bodyEmail || null;
    if (!email) return res.status(400).json({ error: "Email required" });

    let user = await prisma.user.findUnique({ where: { privyUserId: payload.sub } });
    if (!user) {
      const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase();
      if (email.toLowerCase() === ADMIN_EMAIL) {
        user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { privyUserId: payload.sub, isAdmin: true },
          });
        } else {
          user = await prisma.user.create({
            data: { privyUserId: payload.sub, email, name: "Admin", isAdmin: true },
          });
        }
      } else {
        return res.status(403).json({ error: "Not authorized as admin" });
      }
    }
    if (!user.isAdmin) return res.status(403).json({ error: "Not an admin" });
    if (user.status !== "ACTIVE") return res.status(403).json({ error: "Account not active" });

    const jwtToken = sign({ userId: user.id, email: user.email, isAdmin: true, type: "admin" });
    res.json({ token: jwtToken, user });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Customer registration via Privy
router.post("/customer/register", async (req, res) => {
  try {
    const { token: privyToken, firstName, lastName, username, phone, dateOfBirth, gender, country, state, city, timezone, language, marketingConsent } = req.body;
    if (!privyToken) return res.status(400).json({ error: "Token required" });
    if (!firstName || !lastName) return res.status(400).json({ error: "First and last name required" });
    if (!req.body.email) return res.status(400).json({ error: "Email is required" });

    const payload = await verifyPrivyToken(privyToken);
    const email = req.body.email;

    const existing = await prisma.customer.findFirst({
      where: { OR: [{ privyUserId: payload.sub }, { email }].filter(Boolean) },
    });
    if (existing) return res.status(400).json({ error: "Already registered. Please login." });

    if (username) {
      const usernameTaken = await prisma.customer.findUnique({ where: { username } });
      if (usernameTaken) return res.status(400).json({ error: "Username taken" });
    }

    const walletAddr = payload.wallet || payload.wallets?.[0]?.address || ethers.Wallet.createRandom().address;

    const customer = await prisma.customer.create({
      data: {
        privyUserId: payload.sub,
        walletAddress: walletAddr,
        email,
        emailVerified: true,
        firstName, lastName,
        username: username || null,
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        country: country || null,
        state: state || null,
        city: city || null,
        timezone: timezone || null,
        language: language || null,
        marketingConsent: marketingConsent === true,
        isActive: true,
        lastLoginAt: new Date(),
      },
    });

    const token = sign({ customerId: customer.id, email: customer.email, type: "customer" });
    res.json({ token, customer });
  } catch (err) {
    console.error("Customer register error:", err);
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

// Customer login via Privy
router.post("/customer/login", async (req, res) => {
  try {
    const { token: privyToken, email: bodyEmail } = req.body;
    if (!privyToken) return res.status(400).json({ error: "Token required" });

    const payload = await verifyPrivyToken(privyToken);
    const email = bodyEmail || payload.email || null;
    if (!email) return res.status(400).json({ error: "Email required" });

    let customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      customer = await prisma.customer.findUnique({ where: { privyUserId: payload.sub } });
    }
    if (!customer) return res.status(404).json({ error: "Customer not found. Please register." });
    if (!customer.isActive || customer.isBlocked) return res.status(403).json({ error: "Account not active" });

    customer = await prisma.customer.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });

    const token = sign({ customerId: customer.id, email: customer.email, type: "customer" });
    res.json({ token, customer });
  } catch (err) {
    console.error("Customer login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Customer profile update
router.patch("/customer/profile", async (req, res) => {
  // Handled by auth middleware supporting customer JWTs
  res.status(401).json({ error: "Not implemented here" });
});

module.exports = router;
