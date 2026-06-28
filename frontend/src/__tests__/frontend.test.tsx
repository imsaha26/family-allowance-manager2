import React from "react";
import { describe, test, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

// Components
import LandingPage from "@/app/page";
import DashboardPage from "@/app/dashboard/page";
import SettingsClient from "@/app/settings/SettingsClient";
import ActivityFeedClient from "@/app/activity/ActivityFeedClient";
import TransactionCenterClient from "@/app/transactions/TransactionCenterClient";
import AnalyticsClient from "@/app/analytics/AnalyticsClient";

// ── Mock Zustand Stores ──────────────────────────────────────────────────────

const mockWalletState = {
  isConnected: true,
  isConnecting: false,
  wallet: {
    id: "freighter",
    address: "GBTEST0000000000000000000000000000000000000000000000000",
    network: "testnet",
    name: "Freighter",
  },
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  signTx: vi.fn(),
};

vi.mock("@/store/wallet.store", () => ({
  useWalletStore: (selector?: (state: any) => any) => {
    if (selector) return selector(mockWalletState);
    return mockWalletState;
  },
}));

const mockSettingsState = {
  pollingIntervalEnabled: true,
  showSavingsGoals: true,
  activeNavTab: "Wallet",
  network: "testnet",
  setPollingIntervalEnabled: vi.fn(),
  setShowSavingsGoals: vi.fn(),
  setActiveNavTab: vi.fn(),
  setNetwork: vi.fn(),
};

vi.mock("@/store/settings.store", () => ({
  useSettingsStore: (selector?: (state: any) => any) => {
    if (selector) return selector(mockSettingsState);
    return mockSettingsState;
  },
}));

const mockTransactionState = {
  transactions: [
    {
      id: "tx123",
      title: "Create schedule: 10.00 XLM",
      status: "confirmed",
      hash: "h1b2c3d4e5",
      error: null,
      timestamp: Date.now(),
    },
  ],
  updateTransaction: vi.fn(),
  removeTransaction: vi.fn(),
  clearTransactions: vi.fn(),
};

vi.mock("@/store/transaction.store", () => ({
  useTransactionStore: (selector?: (state: any) => any) => {
    if (selector) return selector(mockTransactionState);
    return mockTransactionState;
  },
}));

// ── Mock Contract Hooks ──────────────────────────────────────────────────────

vi.mock("@/hooks/useFamilyRegistry", () => ({
  useFamilyRegistry: vi.fn(() => ({
    members: [
      {
        address: "GBCHILD00000000000000000000000000000000000000000000000",
        role: "Child",
        spending_limit: 100000000n, // 10 XLM in stroops
        savings_goal: 500000000n, // 50 XLM in stroops
        active: true,
        joined_at: 0n,
      },
    ],
    isLoadingMembers: false,
    addMember: vi.fn(),
    isAddingMember: false,
    removeMember: vi.fn(),
    isRemovingMember: false,
    updateLimits: vi.fn(),
    isUpdatingLimits: false,
  })),
}));

vi.mock("@/hooks/useAllowanceDistributor", () => ({
  useAllowanceDistributor: vi.fn(() => ({
    schedules: [],
    isLoadingSchedules: false,
    payments: [
      {
        id: 1,
        schedule_id: 1,
        family_id: 1,
        member: "GBCHILD00000000000000000000000000000000000000000000000",
        amount: 20000000n, // 2 XLM in stroops
        status: "Confirmed",
        ledger: 100,
        timestamp: 1000n,
      },
    ],
    isLoadingPayments: false,
    createSchedule: vi.fn(),
    isCreatingSchedule: false,
    distributeAllowance: vi.fn(),
    isDistributing: false,
    distributeAllDue: vi.fn(),
    isDistributingAll: false,
  })),
}));

vi.mock("@/hooks/useActivityStream", () => ({
  useActivityStream: vi.fn(() => ({
    events: [
      {
        id: "ev123",
        type: "member_added",
        title: "Member Joined",
        description: "A new child joined family Smiths",
        timestamp: Date.now(),
        txHash: "t1x2y3z4",
        icon: "👤",
        color: "text-emerald-400 bg-emerald-500/10",
      },
    ],
    isLoading: false,
    error: null,
  })),
}));

// ── Mock Recharts ────────────────────────────────────────────────────────────

vi.mock("recharts", () => {
  const Dummy = ({ children }: any) => <div>{children}</div>;
  return {
    ResponsiveContainer: Dummy,
    BarChart: Dummy,
    Bar: Dummy,
    PieChart: Dummy,
    Pie: Dummy,
    Cell: Dummy,
    XAxis: Dummy,
    YAxis: Dummy,
    CartesianGrid: Dummy,
    Tooltip: Dummy,
    Legend: Dummy,
  };
});

// ── Render Wrapper Helper ────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

// ── Test Suites ──────────────────────────────────────────────────────────────

describe("Frontend Dashboard & Pages Suite", () => {
  test("1. renders Landing Page showing hero text", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText(/Family Finance,/i)).toBeInTheDocument();
    expect(screen.getByText(/Built on Stellar · Powered by Soroban/i)).toBeInTheDocument();
  });

  test("2. renders Dashboard showing stats placeholders", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Active Schedules/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Payments/i)).toBeInTheDocument();
  });

  test("3. renders Wallet connection details in Settings Page when connected", () => {
    renderWithProviders(<SettingsClient />);
    expect(screen.getByText(/Connected to Freighter/i)).toBeInTheDocument();
  });

  test("4. renders Activity Feed page Client component with event logs", () => {
    renderWithProviders(<ActivityFeedClient />);
    expect(screen.getByText(/A new child joined family Smiths/i)).toBeInTheDocument();
    expect(screen.getByText(/Member Joined/i)).toBeInTheDocument();
  });

  test("5. renders Transaction Center with tracked transactions logs", () => {
    renderWithProviders(<TransactionCenterClient />);
    expect(screen.getByText(/Create schedule: 10.00 XLM/i)).toBeInTheDocument();
    expect(screen.getByText(/Hash: h1b2c3d4e5/i)).toBeInTheDocument();
  });

  test("6. renders Analytics page with calculations and summary statistics", () => {
    renderWithProviders(<AnalyticsClient />);
    expect(screen.getByText(/Total Distributed/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg per Child/i)).toBeInTheDocument();
    // 20000000 stroops is 2.00 XLM (matches Total Distributed and Avg per Child)
    expect(screen.getAllByText(/2.00/i).length).toBeGreaterThanOrEqual(1);
  });
});
