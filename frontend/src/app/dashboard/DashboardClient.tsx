"use client";

import React, { useState } from "react";
import { useWalletStore } from "@/store/wallet.store";
import { useFamilyRegistry } from "@/hooks/useFamilyRegistry";
import { useAllowanceDistributor } from "@/hooks/useAllowanceDistributor";
import { useActivityStream } from "@/hooks/useActivityStream";
import { CardSkeleton, ListSkeleton } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";

export default function DashboardClient() {
  const { isConnected, wallet } = useWalletStore();
  const familyId = 1; // Default demonstration family ID

  const {
    family,
    members,
    isLoadingFamily,
    isLoadingMembers,
    createFamily,
    isCreatingFamily,
  } = useFamilyRegistry(familyId);

  const {
    schedules,
    payments,
    isLoadingSchedules,
    isLoadingPayments,
    distributeAllowance,
    isDistributing,
  } = useAllowanceDistributor(familyId);

  const { events, isLoading: isLoadingEvents } = useActivityStream(familyId);

  const [familyNameInput, setFamilyNameInput] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // ── Render Wallet Connect State ───────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto mt-12 border border-border/60">
        <span className="text-4xl">🔐</span>
        <h2 className="text-xl font-bold mt-4 tracking-tight">Access Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Connect your Stellar wallet extension to view active allowance schedules,
          recipient limits, and execute payouts.
        </p>
      </div>
    );
  }

  const isLoading = isLoadingFamily || isLoadingMembers || isLoadingSchedules || isLoadingPayments;

  // ── Create Family Action ──────────────────────────────────────────────────

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyNameInput) {
      toast.warning("Please enter a family name");
      return;
    }
    try {
      await createFamily(familyNameInput);
      setFamilyNameInput("");
      setIsCreateOpen(false);
    } catch (err) {}
  };

  // ── Distribute Action ─────────────────────────────────────────────────────

  const handleDistribute = async (scheduleId: number) => {
    const toastId = toast.loading("Submitting allowance distribution...");
    try {
      await distributeAllowance(scheduleId);
      toast.success("Allowance payout confirmed on-chain!", { id: toastId });
    } catch (err: any) {
      toast.error(`Distribution failed: ${err.message}`, { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ListSkeleton />
          </div>
          <div>
            <ListSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // If no family exists, show create family page
  const hasNoFamily = !family || !family.active;

  if (hasNoFamily) {
    return (
      <div className="space-y-6 max-w-md mx-auto mt-12">
        <EmptyState
          icon="🏛️"
          title="Create a Family Registry"
          description="It looks like you don't have an active family registry setup yet. Initialize your family on-chain to start automated allowance distributions."
          actionText="Create Family Group"
          onAction={() => setIsCreateOpen(true)}
        />

        {isCreateOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-sm w-full p-6 space-y-6 border border-border animate-in fade-in-50 zoom-in-95">
              <div>
                <h3 className="text-base font-bold">Initialize Family Registry</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  This will trigger an on-chain transaction creating your family group.
                </p>
              </div>

              <form onSubmit={handleCreateFamily} className="space-y-4">
                <input
                  type="text"
                  value={familyNameInput}
                  onChange={(e) => setFamilyNameInput(e.target.value)}
                  placeholder="Family Name (e.g. Smiths)"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:border-primary/50"
                  required
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted/15"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingFamily}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {isCreatingFamily ? "Creating..." : "Confirm on Wallet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Calculate metrics ─────────────────────────────────────────────────────

  const childCount = members.filter((m) => m.role === "Child" && m.active).length;
  const totalDistributed = payments.reduce((acc, p) => acc + Number(p.amount) / 10000000, 0);
  const activeSchedules = schedules.filter((s) => s.active).length;
  const pendingPayoutsCount = schedules.filter((s) => s.active).length; // simple correlation

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Overview of registry family group "{family.name}" (ID #{family.id})
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-5 hover:bg-muted/5 transition-all">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Family Members
          </p>
          <p className="text-2xl font-bold mt-2 text-foreground">{members.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {childCount} Children registered
          </p>
        </div>

        <div className="glass-card p-5 hover:bg-muted/5 transition-all">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Distributed
          </p>
          <p className="text-2xl font-bold mt-2 text-green-400">
            {totalDistributed.toFixed(2)} XLM
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">On-chain payouts confirmed</p>
        </div>

        <div className="glass-card p-5 hover:bg-muted/5 transition-all">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active Schedules
          </p>
          <p className="text-2xl font-bold mt-2 text-blue-400">{activeSchedules}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Configured payouts</p>
        </div>

        <div className="glass-card p-5 hover:bg-muted/5 transition-all">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Pending Distributions
          </p>
          <p className="text-2xl font-bold mt-2 text-amber-400">{pendingPayoutsCount}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Awaiting release ledger</p>
        </div>
      </div>

      {/* Main layout grids */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Schedules / Distributions Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Schedules & Distributions
            </h2>

            {schedules.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border/80 rounded-xl">
                <p className="text-xs text-muted-foreground">
                  No active allowance schedules configured. Go to settings to manage family rules.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {schedules.map((schedule) => {
                  const shortMember = `${schedule.member.slice(0, 4)}...${schedule.member.slice(-4)}`;
                  const amountXlm = (Number(schedule.amount) / 10000000).toFixed(2);
                  return (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between py-4 gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          Child ({shortMember})
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Amount: {amountXlm} XLM · Freq: {schedule.frequency}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDistribute(schedule.id)}
                        disabled={isDistributing}
                        className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
                      >
                        Distribute
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed Column */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Recent Activity
            </h2>

            {isLoadingEvents ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-10 bg-muted rounded" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No recent activity events found.
              </p>
            ) : (
              <div className="space-y-4">
                {events.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex gap-3 text-xs leading-normal">
                    <span className="text-base select-none shrink-0">{e.icon}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{e.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 break-words">
                        {e.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
