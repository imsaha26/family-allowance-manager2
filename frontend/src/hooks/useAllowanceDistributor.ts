import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StellarService } from "@/services/stellar.service";
import { useWalletStore } from "@/store/wallet.store";
import { useTransactionStore } from "@/store/transaction.store";
import { toast } from "sonner";

export function useAllowanceDistributor(familyId?: number) {
  const queryClient = useQueryClient();
  const { wallet, signTx } = useWalletStore();
  const { addTransaction, updateTransaction } = useTransactionStore();
  const passphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

  // ── Queries ────────────────────────────────────────────────────────────────

  const schedulesQuery = useQuery({
    queryKey: ["schedules", familyId],
    queryFn: () => StellarService.getFamilySchedules(familyId!),
    enabled: typeof familyId === "number" && familyId > 0,
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments", familyId],
    queryFn: () => StellarService.getFamilyPayments(familyId!, 30),
    enabled: typeof familyId === "number" && familyId > 0,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createSchedule = useMutation({
    mutationFn: async ({
      member,
      amount,
      frequency,
      startLedger,
    }: {
      member: string;
      amount: bigint;
      frequency: string;
      startLedger: number;
    }) => {
      if (!wallet) throw new Error("Wallet not connected");
      if (!familyId) throw new Error("Family ID is required");
      const trackingId = Math.random().toString(36).substring(2, 9);
      const amountString = (Number(amount) / 10000000).toFixed(2);

      addTransaction({
        id: trackingId,
        title: `Create schedule: ${amountString} XLM (${frequency}) for ${member.slice(0, 4)}...`,
        retryPayload: {
          type: "create_schedule",
          args: [familyId, member, amount.toString(), frequency, startLedger],
        },
      });

      try {
        updateTransaction(trackingId, { status: "processing" });
        const xdr = await StellarService.buildCreateScheduleTx(
          wallet.address,
          familyId,
          member,
          amount,
          frequency,
          startLedger
        );
        const signed = await signTx(xdr, passphrase);
        const txHash = await StellarService.submitTransaction(signed);
        
        updateTransaction(trackingId, { status: "confirmed", hash: txHash });
        return txHash;
      } catch (err: any) {
        const errMsg = err.message || String(err);
        updateTransaction(trackingId, { status: "failed", error: errMsg });
        throw err;
      }
    },
    onSuccess: (txHash) => {
      toast.success("Allowance schedule scheduled successfully!", {
        description: `Tx Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["schedules", familyId] });
    },
    onError: (err: Error) => {
      toast.error("Failed to create schedule", {
        description: err.message,
      });
    },
  });

  const distributeAllowance = useMutation({
    mutationFn: async (scheduleId: number) => {
      if (!wallet) throw new Error("Wallet not connected");
      const trackingId = Math.random().toString(36).substring(2, 9);

      addTransaction({
        id: trackingId,
        title: `Distribute allowance (Schedule #${scheduleId})`,
        retryPayload: { type: "distribute", args: [scheduleId] },
      });

      try {
        updateTransaction(trackingId, { status: "processing" });
        const xdr = await StellarService.buildDistributeTx(wallet.address, scheduleId);
        const signed = await signTx(xdr, passphrase);
        const txHash = await StellarService.submitTransaction(signed);
        
        updateTransaction(trackingId, { status: "confirmed", hash: txHash });
        return txHash;
      } catch (err: any) {
        const errMsg = err.message || String(err);
        updateTransaction(trackingId, { status: "failed", error: errMsg });
        throw err;
      }
    },
    onSuccess: (txHash) => {
      toast.success("Allowance distributed successfully!", {
        description: `Tx Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["payments", familyId] });
      queryClient.invalidateQueries({ queryKey: ["schedules", familyId] });
    },
    onError: (err: Error) => {
      toast.error("Distribution failed", {
        description: err.message,
      });
    },
  });

  const distributeAllDue = useMutation({
    mutationFn: async () => {
      if (!wallet) throw new Error("Wallet not connected");
      if (!familyId) throw new Error("Family ID is required");
      const trackingId = Math.random().toString(36).substring(2, 9);

      addTransaction({
        id: trackingId,
        title: "Batch distribute all due allowances",
        retryPayload: { type: "distribute_all", args: [familyId] },
      });

      try {
        updateTransaction(trackingId, { status: "processing" });
        const xdr = await StellarService.buildDistributeAllDueTx(wallet.address, familyId);
        const signed = await signTx(xdr, passphrase);
        const txHash = await StellarService.submitTransaction(signed);
        
        updateTransaction(trackingId, { status: "confirmed", hash: txHash });
        return txHash;
      } catch (err: any) {
        const errMsg = err.message || String(err);
        updateTransaction(trackingId, { status: "failed", error: errMsg });
        throw err;
      }
    },
    onSuccess: (txHash) => {
      toast.success("All due allowances processed!", {
        description: `Tx Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["payments", familyId] });
      queryClient.invalidateQueries({ queryKey: ["schedules", familyId] });
    },
    onError: (err: Error) => {
      toast.error("Failed to process batch distribution", {
        description: err.message,
      });
    },
  });

  return {
    schedules: schedulesQuery.data || [],
    isLoadingSchedules: schedulesQuery.isLoading,
    payments: paymentsQuery.data || [],
    isLoadingPayments: paymentsQuery.isLoading,

    // Mutation Triggers
    createSchedule: createSchedule.mutateAsync,
    isCreatingSchedule: createSchedule.isPending,

    distributeAllowance: distributeAllowance.mutateAsync,
    isDistributing: distributeAllowance.isPending,

    distributeAllDue: distributeAllDue.mutateAsync,
    isDistributingAll: distributeAllDue.isPending,
  };
}
