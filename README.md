# Magic TEE + Custom Auth Provider

This is a demo of Magic's TEE for WaaS and Auth0 as auth provider. You may replace the auth provider with another provider or use an in-house authentication that is OIDC-compliant.

## Prerequisites

- `ALCHEMY_API_KEY` (or any RPC node URL)
- Auth: (use any OIDC auth provider)
  - `AUTH0_SECRET`
  - `AUTH0_BASE_URL`
  - `AUTH0_ISSUER_BASE_URL`
  - `AUTH0_CLIENT_ID`
  - `AUTH0_CLIENT_SECRET`
- `MAGIC_SECRET_KEY`from the [Magic dashboard](https://dashboard.magic.link/)
- `MONGODB_URI` or use another DB implementation

## Wallet

The wallet actions can be found in `src > api > wallet`, where a wallet is created in `/create` and a transaction is signed and sent in `/signtransaction`.
