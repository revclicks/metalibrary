"use client";

import TopBar from "@/components/layout/TopBar";
import EmptyState from "@/components/ui/EmptyState";
import { Users, Plus, Shield, Eye, Edit2 } from "lucide-react";

export default function TeamPage() {
  return (
    <>
      <TopBar
        title="Team"
        subtitle="Manage your team workspace"
        actions={
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm font-medium" style={{ background: "var(--primary)" }}>
            <Plus className="w-4 h-4" /> Invite Member
          </button>
        }
      />
      <div className="p-6">
        <EmptyState
          icon={Users}
          title="Team workspace"
          description="Upgrade to the Agency plan to invite team members, share folders, and collaborate on swipe files."
          action={{ label: "Upgrade to Agency", onClick: () => {} }}
        />

        <div className="mt-8 p-5 rounded-xl border" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <h3 className="font-semibold mb-4">Permission Levels</h3>
          <div className="space-y-3">
            {[
              { role: "Admin", icon: Shield, desc: "Full access. Can manage members, billing, and all content.", color: "var(--danger)" },
              { role: "Editor", icon: Edit2, desc: "Can save, edit, organize, and delete ads. Cannot manage billing.", color: "var(--warning)" },
              { role: "Viewer", icon: Eye, desc: "Read-only access. Can view ads, folders, and export.", color: "var(--primary)" },
            ].map((r) => (
              <div key={r.role} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--background)" }}>
                <r.icon className="w-5 h-5" style={{ color: r.color }} />
                <div>
                  <p className="text-sm font-medium">{r.role}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
