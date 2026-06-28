/**
 * Shared TypeScript types for smart contract interactions.
 * These mirror the Soroban contract types and are used throughout
 * the service and hook layers.
 */

// ── Roles ────────────────────────────────────────────────────────────────────

export type Role = "Parent" | "Guardian" | "Child";

export const ROLE_LABELS: Record<Role, string> = {
  Parent: "Parent",
  Guardian: "Guardian",
  Child: "Child",
};

export const ROLE_COLORS: Record<Role, string> = {
  Parent: "text-blue-400",
  Guardian: "text-purple-400",
  Child: "text-green-400",
};

// ── Family ────────────────────────────────────────────────────────────────────

export interface FamilyGroup {
  id: number;
  name: string;
  admin: string;       // Stellar public key (G...)
  created_at: bigint;  // Unix timestamp (u64 from contract)
  active: boolean;
}

export interface MemberInfo {
  role: Role;
  spending_limit: bigint;  // in XLM stroops (i128)
  savings_goal: bigint;
  active: boolean;
  joined_at: bigint;
}

export interface FamilyMember extends MemberInfo {
  address: string;         // Stellar public key
  familyId: number;
}

// ── Allowance Schedule ────────────────────────────────────────────────────────

export type ScheduleFrequency = "Daily" | "Weekly" | "Monthly";

export interface AllowanceSchedule {
  id: number;
  family_id: number;
  member: string;          // Stellar public key
  amount: bigint;          // in stroops
  frequency: ScheduleFrequency;
  start_ledger: number;
  active: boolean;
  created_by: string;
}

// ── Payment Record ────────────────────────────────────────────────────────────

export type PaymentStatus = "Pending" | "Processing" | "Confirmed" | "Failed";

export interface PaymentRecord {
  id: number;
  schedule_id: number;
  family_id: number;
  member: string;
  amount: bigint;
  status: PaymentStatus;
  ledger: number;
  timestamp: bigint;
}

// ── Transaction (frontend lifecycle, not on-chain record) ─────────────────────

export type TxLifecycleStatus =
  | "idle"
  | "pending"
  | "signing"
  | "processing"
  | "confirmed"
  | "failed"
  | "cancelled";

export interface Transaction {
  id: string;             // UUID (frontend-generated)
  status: TxLifecycleStatus;
  hash?: string;          // Set after submission
  error?: string;         // Set on failure
  description: string;    // Human-readable label
  createdAt: number;      // Date.now()
  updatedAt: number;
}

// ── Contract Events (from Soroban getEvents) ─────────────────────────────────

export type ContractEventType =
  | "family_created"
  | "member_added"
  | "member_removed"
  | "limits_updated"
  | "role_changed"
  | "allowance_scheduled"
  | "allowance_distributed"
  | "payment_failed"
  | "schedule_updated"
  | "schedule_cancelled";

export interface ContractEvent {
  id: string;
  type: ContractEventType;
  contractId: string;
  ledger: number;
  timestamp: number;
  // Decoded event data (varies by type)
  data: Record<string, unknown>;
}

// ── Network ───────────────────────────────────────────────────────────────────

export type StellarNetwork = "testnet" | "mainnet" | "local";

export interface NetworkConfig {
  network: StellarNetwork;
  networkPassphrase: string;
  rpcUrl: string;
  horizonUrl: string;
  explorerBaseUrl: string;
}

// ── API Responses ─────────────────────────────────────────────────────────────

export interface ApiResult<T> {
  data?: T;
  error?: string;
  loading: boolean;
}
