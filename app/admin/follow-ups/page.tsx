import * as React from "react";
import type { Metadata } from "next";
import { getAdminFollowupsAction } from "@/app/actions/admin";
import { AdminWelfareMonitor } from "@/components/admin/AdminWelfareMonitor";

export const metadata: Metadata = {
  title: "Welfare Monitoring — PawConnect Admin",
  description: "Monitor monthly post-adoption welfare reports and adopter adjustments for 12 months.",
};

export default async function AdminFollowupsPage() {
  const res = await getAdminFollowupsAction("all");
  const allFollowups = res.success && res.data ? res.data : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <AdminWelfareMonitor initialFollowups={allFollowups} />
    </div>
  );
}
