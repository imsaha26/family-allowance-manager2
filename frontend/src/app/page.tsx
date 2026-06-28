import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "Family Allowance Manager",
  description:
    "Decentralized family financial management on the Stellar blockchain. Automate recurring allowances, enforce spending rules, and maintain tamper-proof financial records with Soroban smart contracts.",
};

export default function Home() {
  return <LandingClient />;
}
