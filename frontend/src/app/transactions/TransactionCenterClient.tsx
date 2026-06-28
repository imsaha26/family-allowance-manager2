"use client";

import React, { useState } from "react";
import { useTransactionStore } from "@/store/transaction.store";
import { useWalletStore } from "@/store/wallet.store";
import { StellarService } from "@/services/stellar.service";
import { TrackedTransaction } from "@/types/transaction.types";
import { toast } from "sonner";

export default function TransactionCenterClient() {
  const { isConnected, wallet, signTx } = useWalletStore();
  const { transactions, updateTransaction, removeTransaction, clearTransactions } = useTransactionStore();
  const [filter, setFilter] = useState<string>("all");
  const passphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

  // ── Retry Execution ────────────────────────────────────────────────────────

  const handleRetry = async (tx: TrackedTransaction) => {
    if (!tx.retryPayload) return;
    const { type, args } = tx.retryPayload;
    
    // Set tracking status to pending
    updateTransaction(tx.id, { status: "pending", error: null });

    try {
      let xdr = "";
      const source = wallet?.address || "";
      
      // Re-build transaction based on stored type and args payload
      switch (type) {
        case "create_family":
          xdr = await StellarService.buildCreateFamilyTx(source, args[0]);
          break;
        case "add_member":
          xdr = await StellarService.buildAddMemberTx(source, args[0], args[1], args[2]);
          break;
        case "remove_member":
          xdr = await StellarService.buildRemoveMemberTx(source, args[0], args[1]);
          break;
        case "update_limits":
          xdr = await StellarService.buildUpdateMemberLimitsTx(
            source,
            args[0],
            args[1],
            BigInt(args[2]),
            BigInt(args[3])
          );
          break;
        case "create_schedule":
          xdr = await StellarService.buildCreateScheduleTx(
            source,
            args[0],
            args[1],
            BigInt(args[2]),
            args[3],
            args[4]
          );
          break;
        case "distribute":
          xdr = await StellarService.buildDistributeTx(source, args[0]);
          break;
        case "distribute_all":
          xdr = await StellarService.buildDistributeAllDueTx(source, args[0]);
          break;
      }

      updateTransaction(tx.id, { status: "processing" });
      const signed = await signTx(xdr, passphrase);
      const hash = await StellarService.submitTransaction(signed);
      updateTransaction(tx.id, { status: "confirmed", hash });
      toast.success("Transaction retried successfully!", {
        description: `Tx Hash: ${hash.slice(0, 8)}...${hash.slice(-8)}`,
      });
    } catch (err: any) {
      const errMsg = err.message || String(err);
      updateTransaction(tx.id, { status: "failed", error: errMsg });
      toast.error("Retry transaction failed", {
        description: errMsg,
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto mt-12 border border-border/60">
        <span className="text-4xl">🔐</span>
        <h2 className="text-xl font-bold mt-4">Wallet Not Connected</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Connect your wallet to monitor allowance transactions and track their on-chain lifecycle.
        </p>
      </div>
    );
  }

  // ── Filters & Search ───────────────────────────────────────────────────────

  const filteredTxs = transactions.filter((tx) => {
    if (filter === "all") return true;
    return tx.status === filter;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "processing":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse";
      case "confirmed":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "failed":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Full lifecycle tracking for your family allowance operations
          </p>
        </div>
        {transactions.length > 0 && (
          <button
            onClick={clearTransactions}
            className="px-3 py-1.5 rounded-lg border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/10"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "pending", "processing", "confirmed", "failed"].map((tab) => {
          const count =
            tab === "all"
              ? transactions.length
              : transactions.filter((tx) => tx.status === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filter === tab
                  ? "bg-primary/10 border-primary/25 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {getStatusLabel(tab)}
              {count > 0 && (
                <span className="ml-2 px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground text-[10px]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Transactions Feed */}
      {filteredTxs.length === 0 ? (
        <div className="glass-card p-12 text-center border border-border/60">
          <span className="text-4xl">📂</span>
          <h2 className="text-lg font-bold mt-3 text-muted-foreground">No Transactions</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {filter === "all"
              ? "Your transaction history is empty. Trigger family setup or distributions to get started."
              : `No transactions found with status "${getStatusLabel(filter)}".`}
          </p>
        </div>
      ) : (
        <div className="glass-card divide-y divide-border/40 overflow-hidden">
          {filteredTxs.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-4 p-5 hover:bg-muted/10 transition-colors"
            >
              {/* Status Badge */}
              <span
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 select-none ${getStatusBadgeClass(
                  tx.status
                )}`}
              >
                {getStatusLabel(tx.status)}
              </span>

              {/* Title & Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold tracking-tight text-foreground truncate">
                  {tx.title}
                </h4>
                {tx.hash ? (
                  <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5 select-all">
                    Hash: {tx.hash}
                  </p>
                ) : tx.error ? (
                  <p className="text-[10px] text-red-400 font-mono mt-0.5 truncate select-text">
                    Error: {tx.error}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Waiting for wallet signature / RPC submission...
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {tx.status === "failed" && tx.retryPayload && (
                  <button
                    onClick={() => handleRetry(tx)}
                    className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors"
                  >
                    Retry
                  </button>
                )}

                {tx.hash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-border/80 text-muted-foreground hover:text-foreground text-xs font-semibold hover:bg-muted/15 transition-all"
                  >
                    Explorer ↗
                  </a>
                )}

                <button
                  onClick={() => removeTransaction(tx.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/15 transition-colors"
                  title="Remove from log"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
