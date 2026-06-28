import type { Metadata } from "next";
import TransactionCenterClient from "./TransactionCenterClient";

export const metadata: Metadata = {
  title: "Transaction Center",
  description:
    "Track all allowance transactions with full lifecycle status: Pending, Processing, Confirmed, and Failed.",
};

export default function TransactionsPage() {
  return (
    <div className="page-container">
      <TransactionCenterClient />
    </div>
  );
}
