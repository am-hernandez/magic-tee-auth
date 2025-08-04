# 🔐 Magic TEE Auth Demo

A demonstration of Magic's **Trusted Execution Environment (TEE)** for Wallet-as-a-Service, featuring Auth0 authentication, secure wallet creation, and private key export flow.

## 📋 Table of Contents

- [✨ Try the Live Demo](#-try-the-live-demo)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Local Development](#-local-development)
- [⚙️ Service Configuration](#️-service-configuration)
- [🏗️ Architecture](#️-architecture)
- [🔑 Key Features](#-key-features)
- [📚 Learn More](#-learn-more)

---

## ✨ Try the Live Demo

🚀 **[Click here to try it live!](https://magic-tee-auth.vercel.app/)**

**What you can do:**

- 🔑 **Sign in with Auth0** (Google/email)
- 💰 **Create a Magic TEE wallet** instantly
- 👁️ **Reveal private keys** securely with RSA encryption

Built with **TypeScript**, **Next.js 15**, **Supabase**, and deployed on **Vercel**.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with TypeScript & Tailwind CSS
- **Authentication**: Auth0 (OAuth providers)
- **Wallet Infrastructure**: Magic TEE API (Trusted Execution Environment)
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: Base Sepolia testnet via Alchemy
- **Deployment**: Vercel with serverless functions
- **UI/UX**: React Hot Toast, blur privacy mode

## 🚀 Local Development

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd magic-tee-auth
pnpm install
```

### 2. Environment Setup

Copy the example environment file and configure your values:

```bash
cp .env.example .env.local
# Then edit .env.local with your actual values
```

### 3. Run Locally

⚠️ **Before running locally**: Make sure you've updated `AUTH0_BASE_URL` in your `.env.local` to match your local development URL (usually `http://localhost:3000`).

```bash
pnpm dev
# Open http://localhost:3000
```

## ⚙️ Service Configuration

**Required Services:**

- **Auth0**: Regular Web Application for OAuth
- **Supabase**: PostgreSQL database with provided schema
- **Magic**: TEE API secret key from dashboard
- **Alchemy**: Base Sepolia RPC endpoint

**Environment Variables Required:**

```bash
# Auth0 Configuration
AUTH0_SECRET=your-secret-32-char-string
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.us.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Magic TEE Configuration
MAGIC_SECRET_KEY=sk-live-your-secret-key

# Alchemy Configuration
ALCHEMY_API_KEY=your-alchemy-api-key
```

## 🏗️ Architecture

```
┌─ Frontend (Next.js + TypeScript)
│  ├─ Auth0 OAuth integration
│  ├─ Wallet dashboard with privacy controls
│  └─ Toast notifications & blur mode
│
├─ API Routes (/api/wallet/)
│  ├─ /create - Magic TEE wallet generation
│  ├─ /signtransaction - Transaction signing
│  └─ /reveal-private-key - Secure key revelation
│
├─ Services
│  ├─ Auth0 - User authentication
│  ├─ Magic TEE - Secure wallet operations
│  ├─ Supabase - User & wallet metadata
│  └─ Alchemy - Base Sepolia RPC
│
└─ Security Features
   ├─ RSA encryption for private keys
   ├─ TEE-based key generation
   └─ Visual privacy controls
```

## 🔑 Key Features

- **🛡️ Enterprise Security**: Magic's Trusted Execution Environment
- **🔐 Private Key Revelation**: RSA-encrypted, secure key access
- **👁️ Privacy Controls**: Blur sensitive data from onlookers
- **⚡ Instant Wallets**: One-click wallet creation for authenticated users
- **🌐 Production Ready**: Deployed on Vercel with full TypeScript support

---

## 📚 Learn More

- **[Magic TEE Documentation](https://magic.link/docs)** - Official Magic TEE API docs
- **[Auth0 Next.js Guide](https://auth0.com/docs/quickstart/webapp/nextjs)** - Auth0 integration
- **[Supabase Docs](https://supabase.com/docs)** - Database setup and queries
- **[Vercel Deployment](https://vercel.com/docs)** - Hosting and serverless functions
