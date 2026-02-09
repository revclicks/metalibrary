"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import { User, Bell, Moon, Key, Trash2, Download, Shield } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<{ name: string; email: string; plan: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <>
      <TopBar title="Settings" subtitle="Manage your account and preferences" />
      <div className="p-6 max-w-2xl space-y-6">
        <div className="p-5 rounded-xl border space-y-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5" style={{ color: "var(--primary)" }} />
            <h3 className="font-semibold">Profile</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                defaultValue={user?.name || ""}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--background)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                defaultValue={user?.email || ""}
                disabled
                className="w-full px-3 py-2 rounded-lg border text-sm opacity-60"
                style={{ borderColor: "var(--card-border)", background: "var(--background)" }}
              />
            </div>
            <button className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "var(--primary)" }}>Save Changes</button>
          </div>
        </div>

        <div className="p-5 rounded-xl border space-y-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5" style={{ color: "var(--primary)" }} />
            <h3 className="font-semibold">Subscription</h3>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--background)" }}>
            <div>
              <p className="font-medium capitalize">{user?.plan || "Free"} Plan</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {user?.plan === "free" ? "50 ads, 5 folders, 10 tags" : "Unlimited access"}
              </p>
            </div>
            <button className="px-4 py-1.5 rounded-lg text-sm font-medium border" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
              Upgrade
            </button>
          </div>
        </div>

        <div className="p-5 rounded-xl border space-y-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5" style={{ color: "var(--primary)" }} />
            <h3 className="font-semibold">Notifications</h3>
          </div>
          {[
            { label: "Save confirmations", desc: "Show notification when an ad is saved" },
            { label: "Duplicate warnings", desc: "Warn when saving a duplicate ad" },
            { label: "Team activity", desc: "Notify on team member actions" },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{n.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" style={{ background: "var(--muted-light)" }} />
              </label>
            </div>
          ))}
        </div>

        <div className="p-5 rounded-xl border space-y-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5" style={{ color: "var(--primary)" }} />
            <h3 className="font-semibold">Extension Settings</h3>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Folder</label>
            <select className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--card-border)", background: "var(--background)" }}>
              <option value="">No default folder</option>
            </select>
          </div>
        </div>

        <div className="p-5 rounded-xl border space-y-4 border-red-200">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5" style={{ color: "var(--danger)" }} />
            <h3 className="font-semibold" style={{ color: "var(--danger)" }}>Danger Zone</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export all data</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Download all your saved ads and data</p>
            </div>
            <button className="px-4 py-1.5 rounded-lg text-sm border" style={{ borderColor: "var(--card-border)" }}>
              <Download className="w-4 h-4 inline mr-1" /> Export
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Permanently delete your account and all data</p>
            </div>
            <button className="px-4 py-1.5 rounded-lg text-sm text-white" style={{ background: "var(--danger)" }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
