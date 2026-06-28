import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TrackedTransaction, TransactionStatus } from "@/types/transaction.types";

interface TransactionStoreState {
  transactions: TrackedTransaction[];
}

interface TransactionStoreActions {
  addTransaction: (tx: Omit<TrackedTransaction, "status" | "hash" | "error" | "timestamp"> & {
    retryPayload?: TrackedTransaction["retryPayload"];
  }) => void;
  updateTransaction: (
    id: string,
    updates: Partial<Omit<TrackedTransaction, "id">>
  ) => void;
  removeTransaction: (id: string) => void;
  clearTransactions: () => void;
}

export type TransactionStore = TransactionStoreState & TransactionStoreActions;

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set) => ({
      transactions: [],

      addTransaction: (tx) => {
        const newTx: TrackedTransaction = {
          ...tx,
          status: "pending",
          hash: null,
          error: null,
          timestamp: Date.now(),
        };
        set((state) => ({
          transactions: [newTx, ...state.transactions].slice(0, 100), // cap at 100 items
        }));
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      clearTransactions: () => set({ transactions: [] }),
    }),
    {
      name: "family-allowance-transaction-storage",
    }
  )
);
