# Deployment Guide — Family Allowance Manager

This guide describes the steps required to compile, test, and deploy the Family Allowance Manager smart contracts and Next.js frontend to Testnet and production environments.

---

## 🛠️ Prerequisites & Local Setup

### 1. Install Stellar CLI

Stellar CLI is used to deploy contracts, invoke functions, and generate client bindings.

#### Linux / macOS (Recommended for CI/CD)
```bash
curl -fsSL https://github.com/stellar/stellar-cli/raw/main/install.sh | sh
```

#### Windows (PowerShell)
```powershell
winget install Stellar.StellarCLI
# Or via Cargo:
cargo install --locked stellar-cli --features opt
```

### 2. Configure Testnet Accounts

Deploying contracts requires a funded Stellar secret key. Friendbot is used to create and fund a testnet account.

```bash
# Generate deployer account and fund with 10,000 XLM on Testnet
stellar keys generate --fund deployer --network testnet
```
Verify the address of the generated deployer:
```bash
stellar keys address deployer
```

---

## 📜 Contract Deployment & Initialization

### 1. Compile Soroban Contracts (WASM)

Navigate to the `contracts/` directory and compile the smart contracts:
```bash
cd contracts
stellar contract build
```
This generates the optimized `.wasm` artifacts in:
* `contracts/target/wasm32v1-none/release/family_registry.wasm`
* `contracts/target/wasm32v1-none/release/allowance_distributor.wasm`

### 2. Deploy Family Registry

```bash
REGISTRY_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/family_registry.wasm \
  --source deployer \
  --network testnet)
```

Initialize the registry with the administrator address (deployer address):
```bash
ADMIN=$(stellar keys address deployer)
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source deployer \
  --network testnet \
  -- initialize --admin "$ADMIN"
```

### 3. Deploy Allowance Distributor

Retrieve the Native XLM Stellar Asset Contract (SAC) ID on Testnet:
```bash
XLM_SAC=$(stellar contract id asset --asset native --network testnet)
```

Deploy the distributor contract:
```bash
DISTRIBUTOR_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/allowance_distributor.wasm \
  --source deployer \
  --network testnet)
```

Initialize the distributor, linking the registry and the XLM token contract:
```bash
stellar contract invoke \
  --id "$DISTRIBUTOR_ID" \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin "$ADMIN" \
  --registry_contract "$REGISTRY_ID" \
  --token_contract "$XLM_SAC"
```

### 4. Generate Client Bindings

Client-side interaction relies on TypeScript bindings generated directly from the WASM artifacts:
```bash
cd ..
# Generate Family Registry bindings
stellar contract bindings typescript \
  --contract-id "$REGISTRY_ID" \
  --output-dir packages/family_registry \
  --network testnet \
  --overwrite
(cd packages/family_registry && npm install && npm run build)

# Generate Allowance Distributor bindings
stellar contract bindings typescript \
  --contract-id "$DISTRIBUTOR_ID" \
  --output-dir packages/allowance_distributor \
  --network testnet \
  --overwrite
(cd packages/allowance_distributor && npm install && npm run build)
```

---

## 💻 Frontend Deployment (Vercel)

### 1. Environment Variables Configuration

Deploying the frontend requires setting the public contract variables on your hosting provider:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=C... (Registry Contract ID)
NEXT_PUBLIC_ALLOWANCE_DISTRIBUTOR_CONTRACT_ID=C... (Distributor Contract ID)
NEXT_PUBLIC_XLM_SAC_CONTRACT_ID=C... (Native XLM SAC Contract ID)
NEXT_PUBLIC_STELLAR_EXPLORER_URL=https://stellar.expert/explorer/testnet
NEXT_PUBLIC_ENABLED_WALLETS=freighter,xbull,lobstr,hana
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME="Family Allowance Manager"
```

### 2. Vercel CLI Deployment

Install Vercel CLI and trigger the build:
```bash
npm install -g vercel
cd frontend
vercel login
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```

---

## 🔄 Contract Upgrades Strategy

Both contracts contain an `upgrade(new_wasm_hash)` function. To upgrade a contract without changing its address:

1. Compile the new contract version and get its WASM hash:
   ```bash
   stellar contract install --wasm target/wasm32v1-none/release/new_family_registry.wasm --source deployer --network testnet
   ```
   Take note of the returned WASM hash.
2. Invoke the upgrade method on the active contract:
   ```bash
   stellar contract invoke \
     --id "$REGISTRY_ID" \
     --source deployer \
     --network testnet \
     -- upgrade --new_wasm_hash "<WASM_HASH>"
   ```
   This is guarded by `admin.require_auth()`, ensuring only the owner can trigger contract modifications.
