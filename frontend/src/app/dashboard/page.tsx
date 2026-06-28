import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "View your family wallet balances, upcoming allowances, and recent activity.",
};

/**
 * Dashboard Page
 * Full implementation (FamilyDashboard, MemberCard, allowance widgets) in Phase 4.
 */
export default function DashboardPage() {
  return (
    <div className="page-container">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Family overview, balances, and upcoming allowances
        </p>
      </div>

      {/* Placeholder grid — replaced in Phase 4 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ label, value, sub, color }) => (
          <div key={label} className="glass-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Members + activity row */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-base font-semibold mb-4">Family Members</h2>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view family members. Full component
            implemented in Phase 4.
          </p>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold mb-4">Next Distributions</h2>
          <p className="text-sm text-muted-foreground">
            Upcoming scheduled allowances appear here. Full implementation in
            Phase 4.
          </p>
        </div>
      </div>
    </div>
  );
}

const STAT_CARDS = [
  { label: "Family Members", value: "—", sub: "Connect wallet to load", color: "text-foreground" },
  { label: "Total Distributed", value: "—", sub: "XLM this month", color: "text-green-400" },
  { label: "Active Schedules", value: "—", sub: "Recurring allowances", color: "text-blue-400" },
  { label: "Pending Payments", value: "—", sub: "Awaiting distribution", color: "text-yellow-400" },
];
