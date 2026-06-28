import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // ── Environment ───────────────────────────────────────────────────────
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],

    // ── Coverage ──────────────────────────────────────────────────────────
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "src/__tests__/**",
        "**/*.config.*",
        "src/app/**",          // Page shells — tested via integration tests
        "src/types/**",        // Pure types, nothing to test
        "src/components/ui/**", // shadcn generated — not our logic
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },

    // ── Test inclusion patterns ───────────────────────────────────────────
    include: ["src/__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],

    // ── Reporter ─────────────────────────────────────────────────────────
    reporters: ["verbose"],

    // ── Timeouts ─────────────────────────────────────────────────────────
    testTimeout: 15_000,
    hookTimeout: 10_000,
  },

  // ── Path aliases (mirror tsconfig) ───────────────────────────────────────
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/store": path.resolve(__dirname, "./src/store"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/types": path.resolve(__dirname, "./src/types"),
    },
  },
});
