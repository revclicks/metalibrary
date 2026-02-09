"use client";

import TopBar from "@/components/layout/TopBar";
import { Download, FileSpreadsheet, FileText, Database, Webhook, Sheet } from "lucide-react";

export default function ExportPage() {
  const handleCSVExport = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/export/csv", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meta-ads-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const exports = [
    { icon: FileSpreadsheet, title: "CSV Export", desc: "Export all saved ad data as a CSV file", action: handleCSVExport, available: true },
    { icon: FileText, title: "PDF Export", desc: "Export ads or folders as formatted PDF swipe files", action: () => {}, available: false, badge: "Pro" },
    { icon: Sheet, title: "Google Sheets Sync", desc: "Auto-sync saved ads to a Google Sheet", action: () => {}, available: false, badge: "Pro" },
    { icon: Database, title: "API Access", desc: "REST API for pulling saved ad data into custom tools", action: () => {}, available: false, badge: "Agency" },
    { icon: Webhook, title: "Webhooks", desc: "Fire webhooks on new saves for Zapier or custom workflows", action: () => {}, available: false, badge: "Agency" },
  ];

  return (
    <>
      <TopBar title="Export & Integrations" subtitle="Get your data where you need it" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exports.map((exp) => (
            <div key={exp.title} className="p-5 rounded-xl border" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--primary-light)" }}>
                  <exp.icon className="w-5 h-5" style={{ color: "var(--primary)" }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{exp.title}</h3>
                    {exp.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                        {exp.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{exp.desc}</p>
                  <button
                    onClick={exp.action}
                    disabled={!exp.available}
                    className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
                    style={exp.available ? { background: "var(--primary)", color: "white" } : { border: "1px solid var(--card-border)" }}
                  >
                    {exp.available ? "Export" : "Upgrade to unlock"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
