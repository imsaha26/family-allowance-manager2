import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "View your family wallet balances, upcoming allowances, and recent activity.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
