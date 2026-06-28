import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Health-check endpoint for CI/CD and uptime monitoring.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "family-allowance-manager",
      version: process.env.npm_package_version ?? "1.0.0",
      timestamp: new Date().toISOString(),
      network: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "unknown",
      contracts: {
        family_registry:
          process.env.NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID ?? "not_set",
        allowance_distributor:
          process.env.NEXT_PUBLIC_ALLOWANCE_DISTRIBUTOR_CONTRACT_ID ?? "not_set",
      },
    },
    { status: 200 }
  );
}
