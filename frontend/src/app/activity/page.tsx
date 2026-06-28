import type { Metadata } from "next";
import ActivityFeedClient from "./ActivityFeedClient";

export const metadata: Metadata = {
  title: "Activity Feed",
  description:
    "Real-time activity feed of all on-chain events from your family group.",
};

export default function ActivityPage() {
  return (
    <div className="page-container">
      <ActivityFeedClient />
    </div>
  );
}
