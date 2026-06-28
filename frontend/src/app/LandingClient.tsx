"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/store/wallet.store";
import WalletModal from "@/components/WalletModal";

export default function LandingClient() {
  const router = useRouter();
  const { isConnected, wallet } = useWalletStore();
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const handleCta = () => {
    if (isConnected && wallet) {
      router.push("/dashboard");
    } else {
      setIsWalletOpen(true);
    }
  };

  const shortAddress = wallet?.address
    ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`
    : "";

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background mesh gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(220 85% 60% / 0.12), transparent), " +
            "radial-gradient(ellipse 60% 50% at 80% 90%, hsl(38 88% 55% / 0.06), transparent), " +
            "hsl(220 68% 5%)",
        }}
      />

      {/* ── Nav Header ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 h-16 border-b border-border/40 backdrop-blur-md bg-background/60">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold gradient-text">FAM</span>
          <span className="hidden sm:inline text-sm font-semibold text-muted-foreground">
            Family Allowance Manager
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-primary/25 text-primary bg-primary/10 select-none">
            Stellar Testnet
          </span>
          {isConnected && wallet ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-1.5 rounded-xl bg-muted/40 hover:bg-muted/70 text-xs font-bold border border-border/60 transition-all"
            >
              Dashboard ({shortAddress})
            </button>
          ) : (
            <button
              onClick={() => setIsWalletOpen(true)}
              className="btn-glow px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-6 pt-16">
        <div className="animate-slide-in-top space-y-6">
          {/* Active Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-[10px] font-bold mb-4 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Built on Stellar · Powered by Soroban Contracts
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-balance leading-none">
            Family Finance,{" "}
            <span className="gradient-text block sm:inline">On-Chain.</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            Automate recurring allowance payouts, implement parent/child roles, and enforce custom limits on the Stellar blockchain. Pure transparency, full custody, zero boundaries.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleCta}
              className="btn-glow w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
            >
              {isConnected ? "Launch Dashboard" : "Get Started"}
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border/80 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Dynamic Statistics counters */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-sm mx-auto animate-fade-in border border-border/30 bg-muted/5 p-4 rounded-2xl backdrop-blur-md">
          {[
            { label: "Smart Contracts", value: "2" },
            { label: "Roles", value: "3" },
            { label: "Asset", value: "XLM" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-xl font-bold text-foreground">{value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features List Section ── */}
      <section id="features" className="page-container py-24 border-t border-border/40">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-16 tracking-tight">
          Everything your family needs,{" "}
          <span className="gradient-text">on the blockchain.</span>
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, title, description }) => (
            <div key={title} className="glass-card p-6 hover:border-primary/25 transition-colors group">
              <div className="text-3xl mb-4 group-hover:animate-float select-none">{icon}</div>
              <h3 className="text-sm font-bold mb-2 tracking-tight text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-8 px-6 text-center text-[10px] text-muted-foreground">
        <p>
          Built on{" "}
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            Stellar Network
          </a>{" "}
          · MIT Licensed codebase
        </p>
      </footer>

      {/* Connection Selection Overlay */}
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </main>
  );
}

const FEATURES = [
  {
    icon: "👨‍👩‍👧",
    title: "Family Groups",
    description:
      "Create a family group and add members by their Stellar wallet address. Role-based access control enforced on-chain.",
  },
  {
    icon: "📅",
    title: "Automated Schedules",
    description:
      "Configure daily, weekly, or monthly allowance distributions. Smart contracts handle the rest automatically.",
  },
  {
    icon: "💰",
    title: "Spending Limits",
    description:
      "Set hard on-chain spending limits per member. No contract call can exceed the configured cap.",
  },
  {
    icon: "🔗",
    title: "Immutable History",
    description:
      "Every payment is recorded on-chain forever. Transparent, tamper-proof, and verifiable by anyone.",
  },
  {
    icon: "⚡",
    title: "Real-time Events",
    description:
      "Live activity feed powered by Soroban contract events. See payments the moment they hit the ledger.",
  },
  {
    icon: "🔒",
    title: "Non-custodial",
    description:
      "Your keys, your money. All signing happens in your wallet (Freighter, xBull, Lobstr). No private keys ever leave your device.",
  },
];
