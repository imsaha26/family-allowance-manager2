/**
 * Wallet-related TypeScript types.
 */

export type WalletId =
  | "freighter"
  | "xbull"
  | "lobstr"
  | "hana"
  | "rabet"
  | "albedo";

export interface WalletInfo {
  id: WalletId;
  name: string;
  icon: string;
  description: string;
  downloadUrl: string;
}

export interface ConnectedWallet {
  id: WalletId;
  address: string;        // G... public key
  network: string;
  name: string;
}

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  wallet: ConnectedWallet | null;
  error: string | null;
}

export const SUPPORTED_WALLETS: WalletInfo[] = [
  {
    id: "freighter",
    name: "Freighter",
    icon: "🔷",
    description: "The official Stellar browser extension wallet",
    downloadUrl: "https://www.freighter.app",
  },
  {
    id: "xbull",
    name: "xBull Wallet",
    icon: "🐂",
    description: "Feature-rich Stellar wallet with DeFi integrations",
    downloadUrl: "https://xbull.app",
  },
  {
    id: "lobstr",
    name: "Lobstr",
    icon: "🦞",
    description: "Popular Stellar wallet with mobile & web support",
    downloadUrl: "https://lobstr.co",
  },
  {
    id: "hana",
    name: "Hana Wallet",
    icon: "🌸",
    description: "Simple and secure Stellar wallet",
    downloadUrl: "https://hanawallet.io",
  },
];
