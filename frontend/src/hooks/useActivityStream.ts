import { useState, useEffect } from "react";
import { rpc, scValToNative, Address } from "@stellar/stellar-sdk";

const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const REGISTRY_ID = process.env.NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID ?? "";
const DISTRIBUTOR_ID = process.env.NEXT_PUBLIC_ALLOWANCE_DISTRIBUTOR_CONTRACT_ID ?? "";

export interface ActivityFeedItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: number;
  txHash: string;
  icon: string;
  color: string;
}

const getTopicString = (val: any): string => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (val instanceof Uint8Array || Buffer.isBuffer(val)) {
    return Buffer.from(val).toString("utf-8");
  }
  if (typeof val === "object" && val.toString) {
    const str = val.toString();
    // Strip "Symbol(" and ")" if it's stringified Symbol
    if (str.startsWith("Symbol(")) {
      return str.slice(7, -1);
    }
    return str;
  }
  return String(val);
};

export function useActivityStream(familyId?: number) {
  const [events, setEvents] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let pollInterval: NodeJS.Timeout;
    let startLedger: number | null = null;
    const server = new rpc.Server(RPC_URL);

    const fetchLatestEvents = async () => {
      try {
        if (!REGISTRY_ID || !DISTRIBUTOR_ID) {
          return;
        }

        // 1. Get latest ledger if we don't have a start point
        if (startLedger === null) {
          const latest = await server.getLatestLedger();
          // Lookback 500 ledgers (approx 40 minutes) on first load
          startLedger = Math.max(1, latest.sequence - 500);
        }

        // 2. Fetch events from registry and distributor
        const response = await server.getEvents({
          startLedger,
          filters: [
            {
              type: "contract",
              contractIds: [REGISTRY_ID],
            },
            {
              type: "contract",
              contractIds: [DISTRIBUTOR_ID],
            },
          ],
          limit: 50,
        });

        if (!active) return;

        if (response.events && response.events.length > 0) {
          // Update start ledger to the last fetched event + 1 to avoid overlap in next poll
          const maxLedger = Math.max(...response.events.map((e) => e.ledger));
          startLedger = maxLedger + 1;

          const parsedItems: ActivityFeedItem[] = response.events
            .map((e) => {
              try {
                // Parse topics and value
                const topics = e.topic.map((t) => scValToNative(t));
                const eventName = getTopicString(topics[0]);
                const rawValue = scValToNative(e.value);

                // Default values
                let title = eventName;
                let description = `Contract event triggered: ${eventName}`;
                let icon = "🔔";
                let color = "text-blue-400 bg-blue-500/10 border-blue-500/20";

                // Map specific events
                switch (eventName) {
                  case "family_created": {
                    const famId = Number(topics[1]);
                    const name = rawValue.name ? rawValue.name.toString() : "Family Group";
                    title = "Family Group Created";
                    description = `Family group "${name}" (ID #${famId}) was created.`;
                    icon = "🏛️";
                    color = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
                    break;
                  }
                  case "member_added": {
                    const famId = Number(topics[1]);
                    const memberAddr = topics[2]?.toString() || "";
                    const roleString = rawValue.role ? Object.keys(rawValue.role)[0] : "Member";
                    title = "Member Joined";
                    description = `A new ${roleString} (${memberAddr.slice(0, 4)}...${memberAddr.slice(-4)}) joined Family #${famId}.`;
                    icon = "👤";
                    color = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                    break;
                  }
                  case "member_removed": {
                    const famId = Number(topics[1]);
                    const memberAddr = topics[2]?.toString() || "";
                    title = "Member Removed";
                    description = `Member ${memberAddr.slice(0, 4)}...${memberAddr.slice(-4)} was removed from Family #${famId}.`;
                    icon = "❌";
                    color = "text-red-400 bg-red-500/10 border-red-500/20";
                    break;
                  }
                  case "limits_updated": {
                    const famId = Number(topics[1]);
                    const memberAddr = topics[2]?.toString() || "";
                    const limitVal = rawValue.spending_limit ? BigInt(rawValue.spending_limit) : 0n;
                    const limitString = (Number(limitVal) / 10000000).toFixed(2); // Convert stroops to native
                    title = "Limits Updated";
                    description = `Member limits updated for ${memberAddr.slice(0, 4)}...${memberAddr.slice(-4)}. New Limit: ${limitString} XLM.`;
                    icon = "⚙️";
                    color = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                    break;
                  }
                  case "allowance_scheduled": {
                    const famId = Number(topics[1]);
                    const schedId = Number(topics[2]);
                    const memberAddr = topics[3]?.toString() || "";
                    const amountVal = rawValue.amount ? BigInt(rawValue.amount) : 0n;
                    const amountString = (Number(amountVal) / 10000000).toFixed(2);
                    title = "Allowance Scheduled";
                    description = `Scheduled ${amountString} XLM for ${memberAddr.slice(0, 4)}...${memberAddr.slice(-4)} (Schedule #${schedId}).`;
                    icon = "📅";
                    color = "text-purple-400 bg-purple-500/10 border-purple-500/20";
                    break;
                  }
                  case "allowance_distributed": {
                    const famId = Number(topics[1]);
                    const schedId = Number(topics[2]);
                    const memberAddr = topics[3]?.toString() || "";
                    const amountVal = rawValue.amount ? BigInt(rawValue.amount) : 0n;
                    const amountString = (Number(amountVal) / 10000000).toFixed(2);
                    title = "Allowance Distributed";
                    description = `Distributed ${amountString} XLM to ${memberAddr.slice(0, 4)}...${memberAddr.slice(-4)} (Schedule #${schedId}).`;
                    icon = "✅";
                    color = "text-green-400 bg-green-500/10 border-green-500/20";
                    break;
                  }
                  case "payment_failed": {
                    const famId = Number(topics[1]);
                    const schedId = Number(topics[2]);
                    const memberAddr = topics[3]?.toString() || "";
                    title = "Payment Failed";
                    description = `Failed to process payout to ${memberAddr.slice(0, 4)}...${memberAddr.slice(-4)} (Schedule #${schedId}).`;
                    icon = "⚠️";
                    color = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                    break;
                  }
                }

                // Filter by familyId if provided
                const eventFamilyId = Number(topics[1]);
                if (familyId && eventFamilyId !== familyId) {
                  return null;
                }

                return {
                  id: e.id,
                  type: eventName,
                  title,
                  description,
                  timestamp: Date.now(), // approximation, as Soroban events don't embed block timestamp in API return
                  txHash: e.txHash,
                  icon,
                  color,
                };
              } catch (parseErr) {
                console.error("Failed to parse contract event:", parseErr);
                return null;
              }
            })
            .filter((item): item is ActivityFeedItem => item !== null);

          if (parsedItems.length > 0) {
            setEvents((prev) => {
              // Deduplicate and merge events
              const merged = [...parsedItems, ...prev];
              const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
              return unique.slice(0, 100); // Keep last 100 events
            });
          }
        }

        setIsLoading(false);
        setError(null);
      } catch (err: any) {
        console.error("Error polling contract events:", err);
        if (active) {
          setError(err.message || String(err));
          setIsLoading(false);
        }
      }
    };

    fetchLatestEvents();
    pollInterval = setInterval(fetchLatestEvents, 5000);

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [familyId]);

  return { events, isLoading, error };
}
