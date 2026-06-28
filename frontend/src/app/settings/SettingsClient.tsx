"use client";

import React, { useState } from "react";
import { useWalletStore } from "@/store/wallet.store";
import { useSettingsStore, NetworkType } from "@/store/settings.store";
import { useFamilyRegistry } from "@/hooks/useFamilyRegistry";
import { WalletId } from "@/types/wallet.types";
import { toast } from "sonner";

export default function SettingsClient() {
  const { isConnected, wallet, connectWallet, disconnectWallet } = useWalletStore();
  const {
    pollingIntervalEnabled,
    showSavingsGoals,
    activeNavTab,
    network,
    setPollingIntervalEnabled,
    setShowSavingsGoals,
    setActiveNavTab,
    setNetwork,
  } = useSettingsStore();

  // Load family ID if user is connected
  // For demonstration/testing, we default to family ID 1
  const familyId = 1;
  const {
    members,
    isLoadingMembers,
    addMember,
    isAddingMember,
    removeMember,
    isRemovingMember,
    updateLimits,
    isUpdatingLimits,
  } = useFamilyRegistry(familyId);

  // Local Form States
  const [newMemberAddress, setNewMemberAddress] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Child");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [spendingLimitInput, setSpendingLimitInput] = useState("");
  const [savingsGoalInput, setSavingsGoalInput] = useState("");

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success("Wallet disconnected successfully");
  };

  const handleConnect = async (id: WalletId) => {
    const toastId = toast.loading(`Connecting to ${id}...`);
    try {
      await connectWallet(id);
      toast.success(`Connected to ${id} wallet successfully!`, { id: toastId });
    } catch (err: any) {
      toast.error(`Wallet connection failed: ${err.message}`, { id: toastId });
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberAddress) {
      toast.warning("Please enter a valid wallet address");
      return;
    }
    try {
      await addMember({ member: newMemberAddress, role: newMemberRole });
      setNewMemberAddress("");
      toast.success("Family member registration transaction submitted");
    } catch (err) {}
  };

  const handleUpdateLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      const spendingVal = BigInt(Math.floor(parseFloat(spendingLimitInput || "0") * 10000000));
      const savingsVal = BigInt(Math.floor(parseFloat(savingsGoalInput || "0") * 10000000));
      await updateLimits({
        member: selectedMember,
        spendingLimit: spendingVal,
        savingsGoal: savingsVal,
      });
      setSelectedMember(null);
      setSpendingLimitInput("");
      setSavingsGoalInput("");
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your family details, wallet integrations, and application preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1">
          <nav className="glass-card p-3 space-y-1">
            {SETTINGS_NAV.map(({ icon, label }) => (
              <button
                key={label}
                onClick={() => setActiveNavTab(label)}
                className={`nav-link w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeNavTab === label
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted/15"
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Panels */}
        <div className="lg:col-span-3 space-y-6">
          {activeNavTab === "Wallet" && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold">Wallet Connection</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect your browser wallet extension to authenticate on the platform.
                </p>
              </div>

              {isConnected && wallet ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/80 bg-muted/20 gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      Connected to {wallet.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1 truncate select-all">
                      Address: {wallet.address}
                    </p>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-all shrink-0 self-start sm:self-center"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["freighter", "xbull", "lobstr", "hana"] as WalletId[]).map((id) => (
                    <button
                      key={id}
                      onClick={() => handleConnect(id)}
                      className="p-4 rounded-xl border border-border/60 bg-muted/10 hover:border-primary/45 hover:bg-primary/5 transition-all text-left flex items-center justify-between"
                    >
                      <span className="text-xs font-bold capitalize">{id}</span>
                      <span className="text-xs text-muted-foreground">Connect →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeNavTab === "Network" && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold">Soroban Network Selection</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Select which network you want to deploy and manage allowances on.
                </p>
              </div>

              <div className="space-y-3">
                {NETWORK_OPTIONS.map(({ key, label, desc }) => {
                  const isActive = network === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setNetwork(key as NetworkType)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                        isActive
                          ? "bg-primary/5 border-primary/25"
                          : "border-border/60 hover:border-border hover:bg-muted/10"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                          isActive ? "border-primary" : "border-border"
                        }`}
                      >
                        {isActive && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeNavTab === "Preferences" && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold">User Preferences</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Customize the interface configuration and caching behavior.
                </p>
              </div>

              <div className="divide-y divide-border/30">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold">Real-time Polling</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fetch contract event logs and activity streams every 5 seconds.
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={pollingIntervalEnabled}
                    onClick={() => setPollingIntervalEnabled(!pollingIntervalEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                      pollingIntervalEnabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        pollingIntervalEnabled ? "right-0.5 translate-x-0" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold">Savings Goals Tracking</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Show saving achievements and progress graphs on the dashboard.
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={showSavingsGoals}
                    onClick={() => setShowSavingsGoals(!showSavingsGoals)}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                      showSavingsGoals ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        showSavingsGoals ? "right-0.5 translate-x-0" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeNavTab === "Family" && (
            <div className="space-y-6">
              {/* Add Member Panel */}
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold">Register Family Member</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add new members (Parents, Guardians, or Children) to your family group.
                  </p>
                </div>

                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newMemberAddress}
                    onChange={(e) => setNewMemberAddress(e.target.value)}
                    placeholder="Stellar Public Address (G...)"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:border-primary/50"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/50"
                  >
                    <option value="Child">Child</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Parent">Parent</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isAddingMember}
                    className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                  >
                    {isAddingMember ? "Adding..." : "Add Member"}
                  </button>
                </form>
              </div>

              {/* Members List Panel */}
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold">Family Members</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage active family members, adjust spending limits, or delete associations.
                  </p>
                </div>

                {isLoadingMembers ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-12 bg-muted rounded-lg" />
                    ))}
                  </div>
                ) : members.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-border rounded-xl">
                    <p className="text-xs text-muted-foreground">No registered members found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {members.map((m) => (
                      <div
                        key={m.address}
                        className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold flex items-center gap-2">
                            {m.address.slice(0, 4)}...{m.address.slice(-4)}
                            <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-[10px] text-primary">
                              {m.role}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Limit: {(Number(m.spending_limit) / 10000000).toFixed(2)} XLM ·
                            Goal: {(Number(m.savings_goal) / 10000000).toFixed(2)} XLM
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedMember(m.address);
                              setSpendingLimitInput((Number(m.spending_limit) / 10000000).toString());
                              setSavingsGoalInput((Number(m.savings_goal) / 10000000).toString());
                            }}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted/15 transition-colors"
                          >
                            Update Limits
                          </button>
                          <button
                            onClick={() => removeMember(m.address)}
                            disabled={isRemovingMember}
                            className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Limits Update Modal Overlay */}
              {selectedMember && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="glass-card max-w-md w-full p-6 space-y-6 animate-in fade-in-50 zoom-in-95 duration-200">
                    <div>
                      <h3 className="text-lg font-bold">Update Spending Limits</h3>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Member: {selectedMember}
                      </p>
                    </div>

                    <form onSubmit={handleUpdateLimits} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                          Weekly Spending Limit (XLM)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={spendingLimitInput}
                          onChange={(e) => setSpendingLimitInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:border-primary/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                          Savings Goal Target (XLM)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={savingsGoalInput}
                          onChange={(e) => setSavingsGoalInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:border-primary/50"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedMember(null)}
                          className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted/15 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingLimits}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {isUpdatingLimits ? "Updating..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SETTINGS_NAV = [
  { icon: "🔗", label: "Wallet" },
  { icon: "🌐", label: "Network" },
  { icon: "👨‍👩‍👧", label: "Family" },
  { icon: "🔔", label: "Preferences" },
];

const NETWORK_OPTIONS = [
  { key: "testnet", label: "Testnet (SDF)", desc: "Test SDF Network ; September 2015" },
  { key: "mainnet", label: "Public Network (Mainnet)", desc: "Public Global Stellar Network ; September 2015" },
  { key: "local", label: "Local Standalone", desc: "Local sandbox RPC and Horizon quickstart instance" },
];
