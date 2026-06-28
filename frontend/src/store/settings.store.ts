import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NetworkType = "testnet" | "mainnet" | "local";

interface SettingsState {
  pollingIntervalEnabled: boolean;
  showSavingsGoals: boolean;
  activeNavTab: string;
  network: NetworkType;
}

interface SettingsActions {
  setPollingIntervalEnabled: (val: boolean) => void;
  setShowSavingsGoals: (val: boolean) => void;
  setActiveNavTab: (val: string) => void;
  setNetwork: (net: NetworkType) => void;
}

export type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      pollingIntervalEnabled: true,
      showSavingsGoals: true,
      activeNavTab: "Wallet",
      network: "testnet",

      setPollingIntervalEnabled: (val) => set({ pollingIntervalEnabled: val }),
      setShowSavingsGoals: (val) => set({ showSavingsGoals: val }),
      setActiveNavTab: (val) => set({ activeNavTab: val }),
      setNetwork: (net) => set({ network: net }),
    }),
    {
      name: "family-allowance-settings-storage",
    }
  )
);
