export type TransactionStatus = "pending" | "processing" | "confirmed" | "failed";

export interface TrackedTransaction {
  id: string; // unique ID for tracking
  title: string; // e.g. "Create schedule for Emma"
  status: TransactionStatus;
  hash: string | null;
  error: string | null;
  timestamp: number;
  retryPayload?: {
    type: "create_family" | "add_member" | "remove_member" | "update_limits" | "create_schedule" | "distribute" | "distribute_all";
    args: any[];
  };
}
