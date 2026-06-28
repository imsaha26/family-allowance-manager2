import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StellarService } from "@/services/stellar.service";
import { useWalletStore } from "@/store/wallet.store";
import { useTransactionStore } from "@/store/transaction.store";
import { toast } from "sonner";

export function useFamilyRegistry(familyId?: number) {
  const queryClient = useQueryClient();
  const { wallet, signTx } = useWalletStore();
  const { addTransaction, updateTransaction } = useTransactionStore();
  const passphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

  // ── Queries ────────────────────────────────────────────────────────────────

  const familyQuery = useQuery({
    queryKey: ["family", familyId],
    queryFn: () => StellarService.getFamily(familyId!),
    enabled: typeof familyId === "number" && familyId > 0,
  });

  const membersQuery = useQuery({
    queryKey: ["family-members", familyId],
    queryFn: async () => {
      const addresses = await StellarService.getFamilyMembers(familyId!);
      return await Promise.all(
        addresses.map(async (addr) => {
          const info = await StellarService.getMemberInfo(familyId!, addr);
          return {
            ...info,
            address: addr,
            familyId: familyId!,
          };
        })
      );
    },
    enabled: typeof familyId === "number" && familyId > 0,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createFamily = useMutation({
    mutationFn: async (name: string) => {
      if (!wallet) throw new Error("Wallet not connected");
      const trackingId = Math.random().toString(36).substring(2, 9);
      
      addTransaction({
        id: trackingId,
        title: `Create family: ${name}`,
        retryPayload: { type: "create_family", args: [name] },
      });

      try {
        updateTransaction(trackingId, { status: "processing" });
        const xdr = await StellarService.buildCreateFamilyTx(wallet.address, name);
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
      toast.success("Family group created successfully!", {
        description: `Tx Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["family"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to create family", {
        description: err.message,
      });
    },
  });

  const addMember = useMutation({
    mutationFn: async ({ member, role }: { member: string; role: string }) => {
      if (!wallet) throw new Error("Wallet not connected");
      if (!familyId) throw new Error("Family ID is required");
      const trackingId = Math.random().toString(36).substring(2, 9);
      
      addTransaction({
        id: trackingId,
        title: `Add family member: ${member.slice(0, 4)}... (as ${role})`,
        retryPayload: { type: "add_member", args: [familyId, member, role] },
      });

      try {
        updateTransaction(trackingId, { status: "processing" });
        const xdr = await StellarService.buildAddMemberTx(
          wallet.address,
          familyId,
          member,
          role
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
      toast.success("Family member added successfully!", {
        description: `Tx Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["family-members", familyId] });
    },
    onError: (err: Error) => {
      toast.error("Failed to add member", {
        description: err.message,
      });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberAddress: string) => {
      if (!wallet) throw new Error("Wallet not connected");
      if (!familyId) throw new Error("Family ID is required");
      const trackingId = Math.random().toString(36).substring(2, 9);

      addTransaction({
        id: trackingId,
        title: `Remove member: ${memberAddress.slice(0, 4)}...`,
        retryPayload: { type: "remove_member", args: [familyId, memberAddress] },
      });

      try {
        updateTransaction(trackingId, { status: "processing" });
        const xdr = await StellarService.buildRemoveMemberTx(
          wallet.address,
          familyId,
          memberAddress
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
      toast.success("Member removed successfully!", {
        description: `Tx Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["family-members", familyId] });
    },
    onError: (err: Error) => {
      toast.error("Failed to remove member", {
        description: err.message,
      });
    },
  });

  const updateLimits = useMutation({
    mutationFn: async ({
      member,
      spendingLimit,
      savingsGoal,
    }: {
      member: string;
      spendingLimit: bigint;
      savingsGoal: bigint;
    }) => {
      if (!wallet) throw new Error("Wallet not connected");
      if (!familyId) throw new Error("Family ID is required");
      const trackingId = Math.random().toString(36).substring(2, 9);

      addTransaction({
        id: trackingId,
        title: `Update limits for: ${member.slice(0, 4)}...`,
        retryPayload: {
          type: "update_limits",
          args: [familyId, member, spendingLimit.toString(), savingsGoal.toString()],
        },
      });

      try {
        updateTransaction(trackingId, { status: "processing" });
        const xdr = await StellarService.buildUpdateMemberLimitsTx(
          wallet.address,
          familyId,
          member,
          spendingLimit,
          savingsGoal
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
      toast.success("Limits updated successfully!", {
        description: `Tx Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["family-members", familyId] });
    },
    onError: (err: Error) => {
      toast.error("Failed to update limits", {
        description: err.message,
      });
    },
  });

  return {
    family: familyQuery.data,
    isLoadingFamily: familyQuery.isLoading,
    members: membersQuery.data || [],
    isLoadingMembers: membersQuery.isLoading,
    
    // Mutation Triggers
    createFamily: createFamily.mutateAsync,
    isCreatingFamily: createFamily.isPending,
    
    addMember: addMember.mutateAsync,
    isAddingMember: addMember.isPending,
    
    removeMember: removeMember.mutateAsync,
    isRemovingMember: removeMember.isPending,
    
    updateLimits: updateLimits.mutateAsync,
    isUpdatingLimits: updateLimits.isPending,
  };
}
