/**
 * Vitest global test setup
 * Imported by vitest.config.ts via setupFiles option.
 */
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// ── Auto-cleanup after each test ─────────────────────────────────────────────
afterEach(() => {
  cleanup();
});

// ── Mock next/navigation ─────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// ── Mock next/font (returns CSS variable classes) ────────────────────────────
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter", className: "inter" }),
  JetBrains_Mono: () => ({ variable: "--font-mono", className: "mono" }),
}));

// ── Suppress noisy console output in tests ───────────────────────────────────
// Remove or comment out if you want full console output during debugging.
const originalError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  // Suppress React 18/19 hydration and act() warnings in tests
  if (
    msg.includes("Warning:") ||
    msg.includes("React does not recognize") ||
    msg.includes("Each child in a list")
  ) {
    return;
  }
  originalError(...args);
};
