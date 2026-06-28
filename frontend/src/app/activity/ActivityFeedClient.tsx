"use client";

import React from "react";
import { useActivityStream } from "@/hooks/useActivityStream";
import { useWalletStore } from "@/store/wallet.store";

export default function ActivityFeedClient() {
  const { isConnected, wallet } = useWalletStore();
  const { events, isLoading, error } = useActivityStream();

  if (!isConnected) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto mt-12 border border-border/60">
        <span className="text-4xl">🔐</span>
        <h2 className="text-xl font-bold mt-4">Wallet Not Connected</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Connect your wallet to enable real-time streaming of on-chain contract events
          from the Stellar blockchain network.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Real-time on-chain events from the Family Allowance contracts
          </p>
        </div>
        {/* Live Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-semibold text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live — polling every 5s
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          ⚠️ Connection warning: {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card p-12 text-center border border-border/60">
          <span className="text-4xl">📡</span>
          <h2 className="text-lg font-bold mt-3 text-muted-foreground">No Event Logs Found</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Contract events will appear here in real-time as families are created or allowances are distributed.
          </p>
        </div>
      ) : (
        <div className="glass-card divide-y divide-border/40 overflow-hidden">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-4 p-5 hover:bg-muted/10 transition-colors"
            >
              {/* Event Icon wrapper */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border text-lg shrink-0 ${event.color}`}
              >
                {event.icon}
              </div>

              {/* Event Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold tracking-tight">
                    {event.title}
                  </h3>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground font-mono transition-colors shrink-0"
                  >
                    Explorer ↗
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {event.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    TX: {event.txHash.slice(0, 8)}...{event.txHash.slice(-8)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
