import type { Metadata } from "next";
import AnalyticsClient from "./AnalyticsClient";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Visualize allowance distribution trends, spending patterns, and savings goal progress.",
};

export default function AnalyticsPage() {
  return (
    <div className="page-container">
      <AnalyticsClient />
    </div>
  );
}
