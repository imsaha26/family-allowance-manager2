#!/usr/bin/env node
/**
 * distribution-bot.js — Off-chain cron/scheduler for automated allowance distribution
 *
 * This script runs continuously and checks for allowance schedules that are
 * due for distribution. When found, it signs and submits the distribute()
 * transaction to the Stellar testnet (or configured network).
 *
 * Usage:
 *   node scripts/distribution-bot.js
 *
 * Environment variables required (from .env):
 *   DISTRIBUTION_BOT_SECRET_KEY
 *   NEXT_PUBLIC_SOROBAN_RPC_URL
 *   NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE
 *   NEXT_PUBLIC_ALLOWANCE_DISTRIBUTOR_CONTRACT_ID
 *   DISTRIBUTION_BOT_INTERVAL_SECONDS (default: 60)
 *
 * Full implementation added in Phase 8.
 * This scaffold sets up the loop and logging infrastructure.
 */

import "dotenv/config";
import { createLogger } from "./lib/logger.js";

const logger = createLogger("distribution-bot");

const INTERVAL_MS =
  parseInt(process.env.DISTRIBUTION_BOT_INTERVAL_SECONDS ?? "60", 10) * 1000;
const DISTRIBUTOR_ID = process.env.NEXT_PUBLIC_ALLOWANCE_DISTRIBUTOR_CONTRACT_ID;
const BOT_SECRET = process.env.DISTRIBUTION_BOT_SECRET_KEY;
const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL;
const PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE;

// ── Validation ───────────────────────────────────────────────────────────────

function validateConfig() {
  const missing = [];
  if (!DISTRIBUTOR_ID || DISTRIBUTOR_ID === "REPLACE_AFTER_DEPLOYMENT") {
    missing.push("NEXT_PUBLIC_ALLOWANCE_DISTRIBUTOR_CONTRACT_ID");
  }
  if (!BOT_SECRET || BOT_SECRET === "REPLACE_WITH_BOT_SECRET_KEY") {
    missing.push("DISTRIBUTION_BOT_SECRET_KEY");
  }
  if (!RPC_URL) missing.push("NEXT_PUBLIC_SOROBAN_RPC_URL");
  if (!PASSPHRASE) missing.push("NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE");

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(", ")}`);
    logger.error("Copy .env.example to .env and fill in all values.");
    process.exit(1);
  }
}

// ── Distribution loop ────────────────────────────────────────────────────────

/**
 * Phase 8 implementation will:
 * 1. Use @stellar/stellar-sdk to build a Keypair from BOT_SECRET
 * 2. Call allowance_distributor::get_family_schedules() for all known families
 * 3. Filter schedules where (current_ledger - last_distribution) >= frequency_in_ledgers
 * 4. For each due schedule, call distribute(schedule_id) via InvokeHostFunctionOp
 * 5. Submit the signed transaction and await confirmation
 * 6. Log the result with payment_id and tx hash
 */
async function checkAndDistribute() {
  logger.info("Checking for due allowances...");

  // TODO (Phase 8): implement distribution logic
  // Placeholder: will be filled in Phase 8
  logger.info("  → No families registered yet (scaffold mode)");
}

// ── Main loop ────────────────────────────────────────────────────────────────

async function main() {
  validateConfig();

  logger.info("═".repeat(55));
  logger.info("🤖 Family Allowance Manager — Distribution Bot");
  logger.info(`   Contract: ${DISTRIBUTOR_ID}`);
  logger.info(`   RPC:      ${RPC_URL}`);
  logger.info(`   Interval: ${INTERVAL_MS / 1000}s`);
  logger.info("═".repeat(55));

  // Run immediately on start, then on interval
  await checkAndDistribute();

  const timer = setInterval(async () => {
    try {
      await checkAndDistribute();
    } catch (err) {
      logger.error("Distribution cycle failed:", err.message);
    }
  }, INTERVAL_MS);

  // Graceful shutdown
  process.on("SIGINT", () => {
    logger.info("Shutting down bot...");
    clearInterval(timer);
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    clearInterval(timer);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
