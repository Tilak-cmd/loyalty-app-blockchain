# Namchepoints — Loyalty Platform

A blockchain-based loyalty rewards platform where merchants issue, award, and manage loyalty tokens for customers. Built with React, Express, PostgreSQL, Prisma, Solidity, and Hardhat.

## Architecture

```
loyal/
├── backend/        Express API server (Node.js + Prisma + ethers)
├── frontend/       React SPA (Vite + Privy auth + Tailwind)
├── contracts/      Solidity smart contracts (Hardhat)
└── README.md
```

## Prerequisites

- **Node.js** >= 20
- **PostgreSQL** >= 14
- **Redis** (optional — for session/rate-limit caching)
- **Hardhat** (for local Ethereum node)

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd loyal

# Backend
cd backend && npm install
cp .env.example .env   # edit with your values

# Frontend
cd ../frontend && npm install
cp .env.example .env

# Contracts
cd ../contracts && npm install
cp .env.example .env
```

### 2. Database

Create a PostgreSQL database and update `DATABASE_URL` in `backend/.env`:

```bash
createdb loyal
cd backend
npx prisma db push
```

### 3. Start Hardhat Node (local blockchain)

```bash
cd contracts
npx hardhat node
```

Keep this terminal open. In a **new terminal**, deploy the contracts:

```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Start Backend

```bash
cd backend
npm run dev
```

API runs at `http://localhost:4000`.

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

App runs at `http://localhost:5173`.

## Configuration

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PRIVY_APP_ID` | Privy authentication app ID |
| `PRIVY_APP_SECRET` | Privy app secret |
| `JWT_SECRET` | Secret for signing internal JWTs |
| `RPC_URL` | Ethereum RPC endpoint (default: `http://127.0.0.1:8545`) |
| `PRIVATE_KEY` | Deployer/admin wallet private key |
| `ADMIN_WALLETS` | Comma-separated admin wallet addresses |
| `ADMIN_EMAIL` | Email for auto-promoting to admin |
| `STRIPE_SECRET_KEY` | Stripe secret key (for fiat top-up) |
| `CORS_ORIGIN` | Frontend origin (default: `http://localhost:5173`) |
| `REDIS_URL` | Redis connection string |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (default: `http://localhost:4000/api`) |
| `VITE_PRIVY_APP_ID` | Privy app ID (must match backend) |

### Contracts (`contracts/.env`)

| Variable | Description |
|---|---|
| `PRIVATE_KEY` | Wallet private key for contract deployment |
| `SEPOLIA_RPC_URL` | Sepolia testnet RPC (for deployment) |

## API Overview

All endpoints are prefixed with `/api`.

| Route | Description |
|---|---|
| `GET /health` | Health check |
| **Auth** | |
| `POST /auth/merchant/register` | Register a merchant via Privy |
| `POST /auth/merchant/login` | Merchant login via Privy |
| `POST /auth/customer/register` | Register a customer via Privy |
| `POST /auth/customer/login` | Customer login via Privy |
| `POST /auth/admin/login` | Admin login via Privy |
| **Admin** | |
| `GET /admin/merchants/pending` | List pending merchants |
| `GET /admin/merchants` | List all merchants |
| `PATCH /admin/merchants/:id/approve` | Approve merchant (deploys token contract) |
| `PATCH /admin/merchants/:id/reject` | Reject merchant |
| `POST /admin/merchants/:id/topup` | Admin top-up merchant tokens |
| `GET /admin/stats` | Platform statistics |
| `GET /admin/revenue` | Revenue breakdown |
| **Merchant** | |
| `GET /merchant/status` | Merchant account status |
| `POST /merchant/award` | Award points to a customer |
| `GET /merchant/customers` | List awarded customers |
| `POST /merchant/topup` | Direct token top-up |
| `POST /merchant/create-checkout-session` | Stripe checkout session |
| `POST /merchant/checkout-success` | Confirm Stripe payment |
| `GET /merchant/products` | List merchant products |
| `POST /merchant/products` | Create product |
| **Customer** | |
| `GET /points/balance/:email` | Get customer balance |
| `GET /points/profile` | Get customer profile |
| `PATCH /points/profile` | Update customer profile |
| `GET /points/transactions` | List customer transactions |
| `POST /points/redeem` | Redeem points for a product |
| **Public** | |
| `GET /merchants/public` | List approved merchants |
| `GET /merchants/public/:id/products` | List merchant products |
| **Transactions** | |
| `GET /transactions` | List transactions (role-filtered) |
| `GET /transactions/all` | All transactions (admin only) |

## Smart Contracts

| Contract | Address (local) | Purpose |
|---|---|---|
| `LoyalFactory` | `0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9` | Deploys per-merchant token contracts |
| `MerchantRegistry` | `0xdc64a140aa3e981100a9beca4e685f962f0cf6c9` | Tracks merchant-token mappings |
| `DataRegistry` | `0x5fc8d32690cc91d4c39d9d3abcbd16989f875707` | On-chain data/KYC hashes |
| `LoyalToken` | (per-merchant, deployed via factory) | ERC20 loyalty token per merchant |

Token contract features:
- `mint(address to, uint256 amount)` — only owner (admin wallet)
- `burn(uint256 amount)` — any token holder
- `burnFrom(address account, uint256 amount)` — only owner (admin wallet, for redemptions)

## Auth Flow

1. User authenticates via **Privy** (social/wallet login) on the frontend
2. Frontend receives a Privy JWT and sends it to the backend
3. Backend verifies the Privy JWT using `jose` + Privy JWKS endpoint
4. Backend returns an internal JWT (`jsonwebtoken`) for subsequent requests
5. All API calls use the internal JWT in the `Authorization: Bearer <token>` header

## Testing

```bash
# Backend API tests (if available)
cd backend && npm test
```

## Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS 4, Privy Auth, Axios, React Router 7
- **Backend**: Express 5, Prisma 7, PostgreSQL, ethers.js 6, jose, Stripe, ioredis
- **Contracts**: Solidity 0.8, OpenZeppelin 5, Hardhat 3, viem
