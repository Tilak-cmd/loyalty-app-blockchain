const { jwtVerify, createRemoteJWKSet } = require("jose");
const { verify } = require("../services/jwt");
const prisma = require("../services/prisma");
const { ensureOnChainBalance, providerReady } = require("../services/blockchain");

const privyJWKS = createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${process.env.PRIVY_APP_ID}/jwks.json`));
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase();

function isCompactJWS(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

async function syncBalance(entity, type = "merchant") {
  if (!providerReady) return null;
  const tokenContract = entity.tokenContract;
  const wallet = type === "merchant" ? entity.walletAddress : entity.walletAddress;
  if (!tokenContract || !wallet) return null;
  try {
    const { getBalance } = require("../services/blockchain");
    const onChain = await getBalance(tokenContract, wallet);
    const dbBal = type === "merchant" ? entity.tokenBalance : entity.pointsBalance;
    if (BigInt(onChain) === BigInt(dbBal)) return null;
    await prisma[type === "merchant" ? "merchant" : "customer"].update({
      where: { id: entity.id },
      data: type === "merchant" ? { tokenBalance: BigInt(onChain) } : { pointsBalance: BigInt(onChain) },
    });
    return onChain;
  } catch { return null; }
}

async function autoPromoteAdmin(user) {
  if (!user.isAdmin && user.email && user.email.toLowerCase() === ADMIN_EMAIL) {
    user = await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
  }
  return user;
}

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });
  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Bad format" });

  try {
    let user = null;
    let merchant = null;
    let customer = null;

    if (isCompactJWS(token)) {
      try {
        const { payload } = await jwtVerify(token, privyJWKS, { issuer: "privy.io", audience: process.env.PRIVY_APP_ID });
        user = await prisma.user.findUnique({ where: { privyUserId: payload.sub } });
        merchant = await prisma.merchant.findUnique({ where: { privyUserId: payload.sub } });
        customer = await prisma.customer.findUnique({ where: { privyUserId: payload.sub } });
        if (!user && !merchant && !customer) {
          const email = payload.email || null;
          if (email && email.toLowerCase() === ADMIN_EMAIL) {
            user = await prisma.user.create({
              data: { privyUserId: payload.sub, email, name: payload.email || "Admin", isAdmin: true },
            });
          }
        }
        if (user && payload.email && !user.email) {
          user = await prisma.user.update({ where: { id: user.id }, data: { email: payload.email } });
          user = await autoPromoteAdmin(user);
        }
        if (merchant && payload.email && !merchant.email) {
          merchant = await prisma.merchant.update({ where: { id: merchant.id }, data: { email: payload.email } });
        }
        if (customer && payload.email && !customer.email) {
          customer = await prisma.customer.update({ where: { id: customer.id }, data: { email: payload.email } });
        }
        if (user) req.user = user;
        if (merchant) req.merchant = merchant;
        if (customer) req.customer = customer;
        if (req.user) {
          if (req.user.status && req.user.status !== "ACTIVE") {
            return res.status(403).json({ error: `Account ${req.user.status.toLowerCase()}` });
          }
          return next();
        }
        if (req.merchant) {
          if (req.merchant.status && req.merchant.status !== "ACTIVE") {
            return res.status(403).json({ error: `Account ${req.merchant.status.toLowerCase()}` });
          }
          syncBalance(req.merchant, "merchant").then(s => {
            if (s) req.merchant.tokenBalance = s;
          }).catch(() => {});
          return next();
        }
        if (req.customer) {
          if (!req.customer.isActive || req.customer.isBlocked) {
            return res.status(403).json({ error: "Account not active" });
          }
          syncBalance(req.customer, "customer").then(s => {
            if (s) req.customer.pointsBalance = s;
          }).catch(() => {});
          return next();
        }
      } catch (joseErr) {
        console.warn("Privy verify error:", joseErr.code || joseErr.message);
      }
    }

    const decoded = verify(token);
    if (decoded.type === "merchant") {
      merchant = await prisma.merchant.findUnique({ where: { id: decoded.merchantId } });
      if (!merchant) {
        console.warn("Auth: merchant token but merchantId not found:", decoded.merchantId);
        return res.status(401).json({ error: "Merchant not found", code: "MERCHANT_NOT_FOUND" });
      }
      if (merchant.status && merchant.status !== "ACTIVE") {
        return res.status(403).json({ error: `Account ${merchant.status.toLowerCase()}`, code: "ACCOUNT_INACTIVE" });
      }
      req.merchant = merchant;
      syncBalance(merchant).then(s => {
        if (s) req.merchant.tokenBalance = s;
      }).catch(() => {});
      return next();
    }
    if (decoded.type === "customer") {
      customer = await prisma.customer.findUnique({ where: { id: decoded.customerId } });
      if (!customer) {
        console.warn("Auth: customer token but customerId not found:", decoded.customerId);
        return res.status(401).json({ error: "Customer not found", code: "CUSTOMER_NOT_FOUND" });
      }
      if (!customer.isActive || customer.isBlocked) {
        return res.status(403).json({ error: "Account not active", code: "ACCOUNT_INACTIVE" });
      }
      req.customer = customer;
      syncBalance(customer, "customer").then(s => {
        if (s && s !== null) req.customer.pointsBalance = s;
      }).catch(() => {});
      return next();
    }
    user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      console.warn("Auth: token decoded but user not found. Payload:", JSON.stringify(decoded));
      return res.status(401).json({ error: "User not found", code: "USER_NOT_FOUND" });
    }
    user = await autoPromoteAdmin(user);
    if (user.status && user.status !== "ACTIVE") {
      return res.status(403).json({ error: `Account ${user.status.toLowerCase()}`, code: "ACCOUNT_INACTIVE" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.warn("Auth: JWT verification failed:", err.message);
    res.status(401).json({ error: "Invalid token", code: "INVALID_TOKEN" });
  }
};
