#!/usr/bin/env bash
# upgrade-contract.sh — WASM hash upgrade strategy for Soroban contracts
# Usage: bash scripts/upgrade-contract.sh <contract_name> [registry|distributor]
set -euo pipefail

CONTRACT_NAME="${1:-}"
if [[ -z "$CONTRACT_NAME" ]]; then
  echo "Usage: bash scripts/upgrade-contract.sh <contract_name>"
  echo "  contract_name: family_registry | allowance_distributor"
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACTS_DIR="$ROOT/contracts"
WASM_FILE="$CONTRACTS_DIR/target/wasm32v1-none/release/${CONTRACT_NAME}.wasm"

# Load deployed contract ID
DEPLOYED_JSON="$ROOT/scripts/deployed-contracts.json"
if [[ ! -f "$DEPLOYED_JSON" ]]; then
  echo "❌ deployed-contracts.json not found. Run deploy-testnet.sh first."
  exit 1
fi

# Read contract ID using node (cross-platform JSON parsing)
CONTRACT_ID=$(node -e "const j=require('$DEPLOYED_JSON'); console.log(j.contracts['$CONTRACT_NAME'] ?? '')")
if [[ -z "$CONTRACT_ID" ]]; then
  echo "❌ Contract '$CONTRACT_NAME' not found in deployed-contracts.json"
  exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "⬆️  Upgrading $CONTRACT_NAME"
echo "   Contract ID: $CONTRACT_ID"
echo "═══════════════════════════════════════════════════════"

# Step 1: Build
echo "Step 1: Building $CONTRACT_NAME..."
cd "$CONTRACTS_DIR"
stellar contract build
echo "  ✅ Built"

# Step 2: Upload new WASM, capture hash
echo "Step 2: Uploading WASM to testnet..."
NEW_HASH=$(stellar contract upload \
  --wasm "$WASM_FILE" \
  --source deployer \
  --network testnet | tail -1)
echo "  ✅ WASM hash: $NEW_HASH"

# Step 3: Call upgrade() function (requires admin auth)
echo "Step 3: Invoking upgrade() on contract..."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source deployer \
  --network testnet \
  -- upgrade \
  --new_wasm_hash "$NEW_HASH"
echo "  ✅ Contract upgraded successfully"

# Step 4: Regenerate bindings
echo "Step 4: Regenerating TypeScript bindings..."
stellar contract bindings typescript \
  --contract-id "$CONTRACT_ID" \
  --output-dir "$ROOT/packages/$CONTRACT_NAME" \
  --network testnet \
  --overwrite
(cd "$ROOT/packages/$CONTRACT_NAME" && npm install && npm run build)
echo "  ✅ Bindings regenerated"

echo ""
echo "✅ Upgrade complete. Contract ID unchanged: $CONTRACT_ID"
echo "   New WASM hash: $NEW_HASH"
