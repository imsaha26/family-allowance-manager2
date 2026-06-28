"use client";

import React from "react";
import { useWalletStore } from "@/store/wallet.store";
import { WalletId } from "@/types/wallet.types";
import { toast } from "sonner";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connectWallet, isConnecting } = useWalletStore();

  if (!isOpen) return null;

  const handleConnect = async (id: WalletId) => {
    const toastId = toast.loading(`Connecting to ${id}...`);
    try {
      await connectWallet(id);
      toast.success(`Connected to ${id} wallet successfully!`, { id: toastId });
      onClose();
    } catch (err: any) {
      toast.error(`Connection failed: ${err.message}`, { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="glass-card max-w-sm w-full p-6 space-y-6 relative z-10 border border-border/80 animate-in fade-in-50 zoom-in-95 duration-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Connect a Wallet</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Select a supported Stellar wallet extension to connect.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-bold transition-all"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-3">
          {(["freighter", "xbull", "lobstr", "hana"] as WalletId[]).map((id) => (
            <button
              key={id}
              onClick={() => handleConnect(id)}
              disabled={isConnecting}
              className="p-3.5 rounded-xl border border-border/60 bg-muted/5 hover:border-primary/45 hover:bg-primary/5 transition-all text-left flex items-center justify-between disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="text-xs font-bold capitalize tracking-wide">{id}</span>
              <span className="text-xs text-muted-foreground">Connect →</span>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-center text-muted-foreground leading-normal">
          Make sure your chosen wallet extension is installed and unlocked in your browser before connecting.
        </p>
      </div>
    </div>
  );
}
