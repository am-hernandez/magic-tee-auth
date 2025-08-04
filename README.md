# Magic TEE + Custom Auth Provider

This is a demo of Magic's TEE for WaaS and Auth0 as auth provider built with TypeScript and Next.js. You may replace the auth provider with another provider or use an in-house authentication system.

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed instructions on setting up all required environment variables.

### 3. Service Setup

**Auth0:**

- Create a Regular Web Application
- Configure callback URLs: `{YOUR_BASE_URL}/api/auth/callback`
- Configure logout URLs: `http://localhost:3000` ← **Important for logout to work!**
- Get Client ID, Client Secret, and Domain

**Supabase:**

- Create a Supabase project
- Run the SQL schema from `supabase-schema.sql`
- Get Project URL and Service Role Key

**Magic:**

- Sign up at [Magic Dashboard](https://dashboard.magic.link/)
- Create new app and get Secret Key

**Alchemy:**

- Create app for Base Sepolia testnet
- Get API key

### 4. Run Development Server

```bash
pnpm dev
```

## Project Structure

- **Authentication**: Auth0 integration at `/api/auth/[auth0]`
- **Wallet Creation**: `/api/wallet/create` - Creates Magic TEE wallets for authenticated users
- **Transaction Signing**: `/api/wallet/signtransaction` - Signs and sends transactions using Magic TEE
- **Database**: Supabase (PostgreSQL) stores user wallet metadata
- **Blockchain**: Base Sepolia testnet via Alchemy RPC

## Wallet Functionality

The wallet actions can be found in `src/api/wallet/`:

- `/create` - Creates a new wallet for authenticated users
- `/signtransaction` - Signs and broadcasts transactions
