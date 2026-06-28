#!/usr/bin/env node
/**
 * initialize.js — Build, deploy, and bind all Soroban contracts
 * Works for both local and testnet environments.
 *
 * Usage:
 *   node scripts/initialize.js              # uses .env variables
 *   STELLAR_NETWORK=local node scripts/initialize.js
 */

import "dotenv/config";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { execSync, exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { sync as glob } from "glob";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const CONTRACTS_DIR = path.join(ROOT, "contracts");
const PACKAGES_DIR = path.join(ROOT, "packages");
const FRONTEND_ENV = path.join(ROOT, "frontend", ".env.local");

const execAsync = promisify(exec);
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "local";
const ACCOUNT = process.env.STELLAR_DEPLOYER_ACCOUNT ?? "deployer";
const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "http://localhost:8000/soroban/rpc";
const PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ??
  "Standalone Network ; February 2017";

/** Deployed contracts accumulator */
const deployedContracts = [];

// ─── 1. Create / fund deployer account ──────────────────────────────────────

function createUser() {
  console.log(`\n📋 Setting up account "${ACCOUNT}" on ${NETWORK}...`);
  try {
    execSync(
      `stellar keys generate --fund ${ACCOUNT} --network ${NETWORK} 2>/dev/null`,
      { stdio: "inherit" }
    );
  } catch {
    console.log(`  ℹ️  Account "${ACCOUNT}" may already exist — continuing.`);
  }
}

// ─── 2. Build contracts ──────────────────────────────────────────────────────

function removeFiles(pattern) {
  const files = glob(pattern);
  files.forEach((f) => existsSync(f) && rmSync(f));
}

function buildAll() {
  console.log("\n🔨 Building Soroban contracts...");
  removeFiles(path.join(CONTRACTS_DIR, "target/wasm32v1-none/release/*.wasm"));
  removeFiles(path.join(CONTRACTS_DIR, "target/wasm32v1-none/release/*.d"));
  execSync("stellar contract build", {
    cwd: CONTRACTS_DIR,
    stdio: "inherit",
  });
  console.log("  ✅ Build complete");
}

// ─── 3. Deploy contracts ─────────────────────────────────────────────────────

function filenameNoExtension(file) {
  return path.basename(file, path.extname(file));
}

async function deploy(wasmPath) {
  const name = filenameNoExtension(wasmPath);
  console.log(`\n🚀 Deploying ${name}...`);

  const flags =
    NETWORK === "local" || NETWORK === "standalone"
      ? `--rpc-url ${RPC_URL} --network-passphrase "${PASSPHRASE}"`
      : `--network ${NETWORK}`;

  const { stdout } = await execAsync(
    `stellar contract deploy \
      --wasm ${wasmPath} \
      --source ${ACCOUNT} \
      ${flags} \
      --ignore-checks`
  );

  const contractId = stdout.trim().split("\n").pop().trim();
  deployedContracts.push({ name, wasm: wasmPath, contractId });
  console.log(`  ✅ ${name}: ${contractId}`);
  return contractId;
}

async function deployAll() {
  console.log("\n📦 Deploying all contracts...");
  const wasmFiles = glob(
    path.join(CONTRACTS_DIR, "target/wasm32v1-none/release/*.wasm")
  );

  if (!wasmFiles.length) {
    throw new Error("No WASM files found — did you run buildAll() first?");
  }

  for (const wasm of wasmFiles) {
    await deploy(wasm);
  }
}

// ─── 4. Initialize contracts ─────────────────────────────────────────────────

async function initContracts() {
  console.log("\n⚙️  Initializing contracts...");

  const registry = deployedContracts.find((c) => c.name === "family_registry");
  const distributor = deployedContracts.find(
    (c) => c.name === "allowance_distributor"
  );

  if (!registry || !distributor) {
    throw new Error("Expected both contracts to be deployed");
  }

  const flags =
    NETWORK === "local" || NETWORK === "standalone"
      ? `--rpc-url ${RPC_URL} --network-passphrase "${PASSPHRASE}"`
      : `--network ${NETWORK}`;

  const adminAddr = execSync(
    `stellar keys address ${ACCOUNT}`
  ).toString().trim();

  // Init family_registry
  await execAsync(
    `stellar contract invoke \
      --id ${registry.contractId} \
      --source ${ACCOUNT} \
      ${flags} \
      -- initialize --admin ${adminAddr}`
  );
  console.log("  ✅ family_registry initialized");

  // Get XLM SAC
  const { stdout: sacOut } = await execAsync(
    `stellar contract id asset --asset native ${flags}`
  );
  const xlmSac = sacOut.trim();
  console.log(`  ✅ XLM SAC: ${xlmSac}`);

  // Init allowance_distributor
  await execAsync(
    `stellar contract invoke \
      --id ${distributor.contractId} \
      --source ${ACCOUNT} \
      ${flags} \
      -- initialize \
      --admin ${adminAddr} \
      --registry_contract ${registry.contractId} \
      --token_contract ${xlmSac}`
  );
  console.log("  ✅ allowance_distributor initialized");

  // Store SAC ID for binding generation
  deployedContracts.push({ name: "xlm_sac", contractId: xlmSac });
}

// ─── 5. Generate TypeScript bindings ─────────────────────────────────────────

async function bind({ name, contractId }) {
  if (name === "xlm_sac") return; // SAC uses the standard SDK client
  console.log(`\n🔗 Generating TS bindings for ${name}...`);

  const outputDir = path.join(PACKAGES_DIR, name);

  const flags =
    NETWORK === "local" || NETWORK === "standalone"
      ? `--rpc-url ${RPC_URL} --network-passphrase "${PASSPHRASE}"`
      : `--network ${NETWORK}`;

  execSync(
    `stellar contract bindings typescript \
      --contract-id ${contractId} \
      --output-dir ${outputDir} \
      ${flags} \
      --overwrite`,
    { stdio: "inherit" }
  );
  execSync("npm install && npm run build", { cwd: outputDir, stdio: "inherit" });
  console.log(`  ✅ Bindings built: ${outputDir}`);
}

async function bindAll() {
  for (const contract of deployedContracts) {
    await bind(contract);
  }
}

// ─── 6. Write frontend .env.local ────────────────────────────────────────────

function writeEnv() {
  const registry = deployedContracts.find((c) => c.name === "family_registry");
  const distributor = deployedContracts.find(
    (c) => c.name === "allowance_distributor"
  );
  const xlmSac = deployedContracts.find((c) => c.name === "xlm_sac");

  const envContent = [
    `# Auto-generated by initialize.js — ${new Date().toISOString()}`,
    `NEXT_PUBLIC_STELLAR_NETWORK=${NETWORK}`,
    `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="${PASSPHRASE}"`,
    `NEXT_PUBLIC_SOROBAN_RPC_URL=${RPC_URL}`,
    `NEXT_PUBLIC_HORIZON_URL=${
      NETWORK === "testnet"
        ? "https://horizon-testnet.stellar.org"
        : "http://localhost:8000"
    }`,
    `NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID=${registry?.contractId ?? ""}`,
    `NEXT_PUBLIC_ALLOWANCE_DISTRIBUTOR_CONTRACT_ID=${distributor?.contractId ?? ""}`,
    `NEXT_PUBLIC_XLM_SAC_CONTRACT_ID=${xlmSac?.contractId ?? ""}`,
    `NEXT_PUBLIC_STELLAR_EXPLORER_URL=https://stellar.expert/explorer/${NETWORK}`,
    `NEXT_PUBLIC_APP_URL=http://localhost:3000`,
    `NEXT_PUBLIC_ENABLE_ACTIVITY_FEED=true`,
    `NEXT_PUBLIC_ACTIVITY_POLL_INTERVAL_MS=5000`,
    `NEXT_PUBLIC_ENABLE_ANALYTICS=true`,
    `NEXT_PUBLIC_ENABLE_SAVINGS_GOALS=true`,
    `LOG_LEVEL=info`,
  ].join("\n");

  writeFileSync(FRONTEND_ENV, envContent);
  console.log(`\n✅ Written: ${FRONTEND_ENV}`);
}

// ─── 7. Print summary ────────────────────────────────────────────────────────

function printSummary() {
  console.log("\n" + "═".repeat(60));
  console.log("🎉 Initialization Complete!");
  console.log("═".repeat(60));
  for (const { name, contractId } of deployedContracts) {
    console.log(`  ${name.padEnd(30)} ${contractId}`);
  }
  console.log("\n📋 Next steps:");
  console.log("  1. cd frontend && npm run dev");
  console.log("  2. Open http://localhost:3000");
  console.log("  3. Connect your Freighter wallet");
  console.log("═".repeat(60) + "\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌟 Family Allowance Manager — Initialize (${NETWORK})`);
  createUser();
  buildAll();
  await deployAll();
  await initContracts();
  await bindAll();
  writeEnv();
  printSummary();
}

main().catch((err) => {
  console.error("\n❌ Initialization failed:", err.message);
  process.exit(1);
});
