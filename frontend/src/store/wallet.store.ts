import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ConnectedWallet, WalletId, WalletState } from "@/types/wallet.types";
import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";

interface WalletStoreActions {
  connectWallet: (id: WalletId) => Promise<void>;
  disconnectWallet: () => void;
  signTx: (xdr: string, passphrase: string) => Promise<string>;
  clearError: () => void;
}

export type WalletStore = WalletState & WalletStoreActions;

// Helper to initialize the static kit configuration
let isKitInitialized = false;

function ensureKitInitialized() {
  if (!isKitInitialized) {
    const network =
      process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
        ? Networks.PUBLIC
        : Networks.TESTNET;

    StellarWalletsKit.init({
      network,
      modules: [
        new FreighterModule(),
        new xBullModule(),
        new LobstrModule(),
        new HanaModule(),
      ],
    });
    isKitInitialized = true;
  }
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      // State
      isConnected: false,
      isConnecting: false,
      wallet: null,
      error: null,

      // Actions
      connectWallet: async (id: WalletId) => {
        set({ isConnecting: true, error: null });
        try {
          ensureKitInitialized();
          
          StellarWalletsKit.setWallet(id);
          const { address } = await StellarWalletsKit.getAddress();
          const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";

          set({
            isConnected: true,
            isConnecting: false,
            wallet: {
              id,
              address,
              network,
              name: id.charAt(0).toUpperCase() + id.slice(1),
            },
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          set({
            isConnecting: false,
            isConnected: false,
            wallet: null,
            error: `Failed to connect wallet: ${errMsg}`,
          });
        }
      },

      disconnectWallet: () => {
        set({
          isConnected: false,
          wallet: null,
          error: null,
        });
      },

      signTx: async (xdr: string, passphrase: string) => {
        const { wallet } = get();
        if (!wallet) {
          throw new Error("Wallet not connected");
        }
        
        try {
          ensureKitInitialized();
          StellarWalletsKit.setWallet(wallet.id);

          const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
            networkPassphrase: passphrase,
            address: wallet.address,
          });

          return signedTxXdr;
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          throw new Error(`Signing transaction failed: ${errMsg}`);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "family-allowance-wallet-storage",
      partialize: (state) => ({
        isConnected: state.isConnected,
        wallet: state.wallet,
      }),
    }
  )
);
