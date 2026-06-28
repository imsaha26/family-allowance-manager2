"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWalletStore } from "@/store/wallet.store";
import { useSettingsStore } from "@/store/settings.store";
import WalletModal from "./WalletModal";
import { toast } from "sonner";

interface NavigationShellProps {
  children: React.ReactNode;
}

export default function NavigationShell({ children }: NavigationShellProps) {
  const pathname = usePathname();
  const { isConnected, wallet, disconnectWallet } = useWalletStore();
  const { network } = useSettingsStore();
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success("Wallet disconnected successfully");
  };

  // Hide shell on Landing page
  const isLanding = pathname === "/";
  if (isLanding) {
    return <>{children}</>;
  }

  const shortAddress = wallet?.address
    ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`
    : "";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* ── Desktop Side Navigation ── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/40 shrink-0 sticky top-0 h-screen bg-background/50 backdrop-blur-md">
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border/40">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text">FAM</span>
            <span className="text-xs text-muted-foreground font-mono">v1.0</span>
          </Link>
          <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/25 text-[10px] font-bold text-primary capitalize select-none">
            {network}
          </span>
        </div>

        {/* Links */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ icon, label, path }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={label}
                href={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                  isActive
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted/15 hover:text-foreground"
                }`}
              >
                <span className="text-sm">{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Wallet connection block */}
        <div className="p-4 border-t border-border/40">
          {isConnected && wallet ? (
            <div className="p-3.5 rounded-xl border border-border bg-muted/15 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-green-400 flex items-center gap-1.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Active
                </span>
                <span className="text-[9px] text-muted-foreground capitalize font-mono">
                  {wallet.id}
                </span>
              </div>
              <p className="text-[10px] text-foreground font-mono truncate select-all">
                {shortAddress}
              </p>
              <button
                onClick={handleDisconnect}
                className="w-full text-center py-1.5 rounded-lg border border-red-500/20 text-[10px] font-bold text-red-400 hover:bg-red-500/10 transition-all mt-1"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsWalletOpen(true)}
              className="w-full text-center py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile Top Header ── */}
      <header className="md:hidden h-16 border-b border-border/40 flex items-center justify-between px-4 sticky top-0 z-40 bg-background/60 backdrop-blur-md">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold gradient-text">FAM</span>
        </Link>

        <div className="flex items-center gap-3">
          {isConnected && wallet ? (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 rounded-lg border border-border text-[10px] font-bold text-muted-foreground"
            >
              {shortAddress} ✕
            </button>
          ) : (
            <button
              onClick={() => setIsWalletOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold"
            >
              Connect
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full pb-20 md:pb-8">
        {children}
      </main>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-background/70 backdrop-blur-lg border-t border-border/40 z-40 flex items-center justify-around px-2">
        {NAV_ITEMS.map(({ icon, label, path }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={label}
              href={path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                isActive ? "text-primary scale-105" : "text-muted-foreground"
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              <span className="text-[9px] font-bold tracking-tight">{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Reusable Wallet Connection Modal */}
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </div>
  );
}

const NAV_ITEMS = [
  { icon: "🏛️", label: "Dashboard", path: "/dashboard" },
  { icon: "📡", label: "Activity Feed", path: "/activity" },
  { icon: "📂", label: "Transactions", path: "/transactions" },
  { icon: "📊", label: "Analytics", path: "/analytics" },
  { icon: "⚙️", label: "Settings", path: "/settings" },
];
