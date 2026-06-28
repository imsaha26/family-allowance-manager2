# Security Model — Family Allowance Manager

## Overview

This document describes the threat model, mitigations, and security
practices for the Family Allowance Manager platform.

---

## Smart Contract Security

### Authentication

Every state-mutating function in both contracts calls `caller.require_auth()`
before executing any logic. The Soroban host enforces this — if the
transaction is not signed by `caller`, it panics at the host level.

```rust
pub fn add_member(env: Env, caller: Address, ...) -> Result<(), ContractError> {
    caller.require_auth();     // ← Host-enforced; cannot be bypassed
    require_role(&env, &caller, family_id, &[Role::Parent, Role::Guardian])?;
    // ...
}
```

### Role-Based Access Control

Roles are stored on-chain in `family_registry`. The `allowance_distributor`
performs a **cross-contract call** to verify the member's role and spending
limit before every distribution. There is no trust assumption between the
two contracts — the registry enforces the rules.

### Spending Limit Enforcement

The `allowance_distributor` fetches `MemberInfo.spending_limit` from the
registry and rejects any distribution where `amount > spending_limit`. This
check happens atomically in the same transaction.

### Upgrade Safety

Both contracts implement `upgrade(new_wasm_hash)` guarded by admin
`require_auth()`. The admin private key should be a hardware wallet or
multisig in production. The contract ID never changes on upgrade.

### State Archival Protection

All persistent ledger entries call `env.storage().persistent().extend_ttl(...)`
with a 1-year TTL bump on every read/write. This prevents state archival from
causing data loss.

---

## Frontend Security

### No Private Key Handling

Private keys never touch the frontend code. All transaction signing is
delegated to the user's wallet extension (Freighter, xBull, etc.) via
`StellarWalletsKit`. The frontend only sees the signed XDR, never the key.

### Event Trust Boundary

The frontend only consumes Soroban events from the known, hardcoded contract
addresses (`NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID` and
`NEXT_PUBLIC_ALLOWANCE_DISTRIBUTOR_CONTRACT_ID`). Events from other contracts
are ignored.

### Environment Variable Separation

- `NEXT_PUBLIC_*` — safe for browser, contain no secrets
- `STELLAR_*` / `DISTRIBUTION_*` — server-side/CI only, contain keys

The `.gitignore` explicitly excludes `.env`, `.env.local`, and all secret files.

### Content Security Policy

`next.config.ts` sets a `Content-Security-Policy` header that:
- Restricts `connect-src` to Stellar testnet/mainnet RPC and Horizon endpoints
- Disables `object-src` entirely
- Restricts `script-src` to same-origin

---

## Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|-----------|
| Unauthorized distribution | Low | High | `require_auth()` + role check |
| Role escalation | Low | High | On-chain role verification per call |
| Spending limit bypass | Low | Medium | Cross-contract validation in distributor |
| Replay attack | Very Low | High | Stellar sequence numbers (protocol-level) |
| Reentrancy | Very Low | High | Soroban host prevents reentrancy |
| Contract upgrade abuse | Low | Critical | Admin-only `upgrade()` with `require_auth()` |
| Frontend key theft | Very Low | Critical | Keys never in frontend; wallet extensions handle signing |
| Phishing (fake frontend) | Medium | High | Wallet shows contract ID in signing dialog |
| State archival loss | Low | High | TTL bumping on all persistent entries |
| Supply chain attack | Low | Medium | Deterministic WASM build; hash-verified on upgrade |

---

## Recommended Production Hardening

1. **Admin multisig**: Use a time-locked multisig account as the contract admin
2. **Rate limiting**: Add on-chain distribution frequency validation (already done via `LAST_DIST_{schedule_id}`)
3. **Emergency pause**: Add an `admin::pause()` function to halt distributions
4. **Audit**: Commission a third-party Soroban security audit before mainnet
5. **Bug bounty**: Set up a responsible disclosure program
