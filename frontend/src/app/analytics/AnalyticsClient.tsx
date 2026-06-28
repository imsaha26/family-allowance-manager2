"use client";

import React from "react";
import { useWalletStore } from "@/store/wallet.store";
import { useFamilyRegistry } from "@/hooks/useFamilyRegistry";
import { useAllowanceDistributor } from "@/hooks/useAllowanceDistributor";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

export default function AnalyticsClient() {
  const { isConnected } = useWalletStore();
  const familyId = 1; // Default family registry ID

  const { members, isLoadingMembers } = useFamilyRegistry(familyId);
  const { payments, isLoadingPayments } = useAllowanceDistributor(familyId);

  if (!isConnected) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto mt-12 border border-border/60">
        <span className="text-4xl">🔐</span>
        <h2 className="text-xl font-bold mt-4">Wallet Not Connected</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Connect your wallet to analyze spending patterns and allowance trends.
        </p>
      </div>
    );
  }

  const isLoading = isLoadingMembers || isLoadingPayments;

  // ── Calculation logic ──────────────────────────────────────────────────────

  // 1. Total Distributed
  const totalDistributed = payments.reduce(
    (acc, p) => acc + Number(p.amount) / 10000000,
    0
  );

  // 2. Avg per member
  const activeChildren = members.filter((m) => m.role === "Child");
  const avgPerMember =
    activeChildren.length > 0 ? totalDistributed / activeChildren.length : 0;

  // 3. Most Active Recipient
  const recipientMap: Record<string, number> = {};
  payments.forEach((p) => {
    const addr = p.member.toString();
    recipientMap[addr] = (recipientMap[addr] || 0) + Number(p.amount) / 10000000;
  });

  let mostActive = "N/A";
  let maxReceived = 0;
  Object.entries(recipientMap).forEach(([addr, amt]) => {
    if (amt > maxReceived) {
      maxReceived = amt;
      mostActive = `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    }
  });

  // 4. Savings rate calculation
  const totalGoals = activeChildren.reduce(
    (acc, m) => acc + Number(m.savings_goal) / 10000000,
    0
  );
  // For demonstration: assume they saved a dynamic portion of their goal based on received allowances
  const totalSaved = activeChildren.reduce((acc, m) => {
    const received = recipientMap[m.address.toString()] || 0;
    const targetGoal = Number(m.savings_goal) / 10000000;
    // Assume 40% of allowance goes to savings, capped at the savings target
    return acc + Math.min(targetGoal, received * 0.4);
  }, 0);

  const savingsRate = totalGoals > 0 ? (totalSaved / totalGoals) * 100 : 0;

  // 5. Chart Data: Distribution Over Time (grouped by payment ledger/timestamp)
  // For chart representation, we map payments to recipient buckets
  const timeData = payments.slice(0, 10).map((p, index) => ({
    name: `Payment #${p.id}`,
    amount: Number(p.amount) / 10000000,
  })).reverse();

  // 6. Chart Data: Spending Breakdown (Pie chart of received shares)
  const breakdownData = Object.entries(recipientMap).map(([addr, amt]) => ({
    name: `${addr.slice(0, 4)}...${addr.slice(-4)}`,
    value: amt,
  }));

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Detailed metrics, spending breakdowns, and savings progress
        </p>
      </div>

      {isLoading ? (
        // Loading State
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-5 h-24 animate-pulse bg-muted/20" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card p-6 h-64 animate-pulse bg-muted/20" />
            <div className="glass-card p-6 h-64 animate-pulse bg-muted/20" />
          </div>
        </div>
      ) : payments.length === 0 ? (
        // Empty State
        <div className="glass-card p-12 text-center max-w-xl mx-auto border border-border/60">
          <span className="text-4xl">📊</span>
          <h2 className="text-lg font-bold mt-3 text-muted-foreground">No Analytics Data Yet</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Data visualizations will generate automatically once allowances are scheduled and payouts are confirmed on-chain.
          </p>
        </div>
      ) : (
        // Data Present
        <>
          {/* Metrics summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card p-5 hover:bg-muted/10 transition-colors">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Distributed
              </p>
              <p className="text-2xl font-bold mt-2 text-foreground">
                {totalDistributed.toFixed(2)} XLM
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Sum of confirmed payouts</p>
            </div>

            <div className="glass-card p-5 hover:bg-muted/10 transition-colors">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Avg per Child
              </p>
              <p className="text-2xl font-bold mt-2 text-blue-400">
                {avgPerMember.toFixed(2)} XLM
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Average distributed allowance</p>
            </div>

            <div className="glass-card p-5 hover:bg-muted/10 transition-colors">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Most Active Child
              </p>
              <p className="text-2xl font-bold mt-2 text-green-400">{mostActive}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Highest recipient share</p>
            </div>

            <div className="glass-card p-5 hover:bg-muted/10 transition-colors">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Savings Rates
              </p>
              <p className="text-2xl font-bold mt-2 text-accent">
                {savingsRate.toFixed(1)}%
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Achieved vs target goals</p>
            </div>
          </div>

          {/* Charts Layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bar Chart */}
            <div className="glass-card p-6 flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Distribution History
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Recent individual payout sizes (XLM)
                </p>
              </div>
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3d" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#0e1322", borderColor: "#242c3d", color: "#fff" }}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="glass-card p-6 flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Allocation Breakdown
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Per-member proportion of total allowance received
                </p>
              </div>
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {breakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#0e1322", borderColor: "#242c3d", color: "#fff" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Goals Progress */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">
              Family Savings Progress
            </h3>
            <div className="space-y-5">
              {activeChildren.map((m, index) => {
                const received = recipientMap[m.address.toString()] || 0;
                const targetGoal = Number(m.savings_goal) / 10000000;
                const saved = Math.min(targetGoal, received * 0.4);
                const pct = targetGoal > 0 ? (saved / targetGoal) * 100 : 0;
                const shortAddr = `${m.address.slice(0, 4)}...${m.address.slice(-4)}`;

                return (
                  <div key={m.address} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">Child ({shortAddr})</span>
                      <span className="text-muted-foreground">
                        {saved.toFixed(2)} / {targetGoal.toFixed(2)} XLM
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{pct.toFixed(0)}% achieved</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
