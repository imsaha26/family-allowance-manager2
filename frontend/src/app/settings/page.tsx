import type { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your family group, wallet connection, notification preferences, and security settings.",
};

export default function SettingsPage() {
  return (
    <div className="page-container">
      <SettingsClient />
    </div>
  );
}
