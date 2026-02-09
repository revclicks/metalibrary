"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import { BarChart3, TrendingUp, Image, Video, Layers, Users, FolderOpen, Tags } from "lucide-react";

interface Analytics {
  totalAds: number;
  totalFolders: number;
  totalTags: number;
  formatBreakdown: { format: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  topAdvertisers: { name: string; count: number }[];
  recentActivity: { id: string; advertiserName: string; format: string; savedAt: string }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/analytics", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setData(await res.json());
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  const formatIcon: Record<string, React.ReactNode> = {
    image: <Image className="w-4 h-4" />,
    video: <Video className="w-4 h-4" />,
    carousel: <Layers className="w-4 h-4" />,
  };

  if (loading) return (
    <>
      <TopBar title="Analytics" subtitle="Insights from your saved ads" />
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: "var(--card-hover)" }} />
        ))}
      </div>
    </>
  );

  if (!data) return null;

  const maxAdvCount = Math.max(...data.topAdvertisers.map((a) => a.count), 1);

  return (
    <>
      <TopBar title="Analytics" subtitle="Insights from your saved ads" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Ads Saved", value: data.totalAds, icon: BarChart3, color: "var(--primary)" },
            { label: "Folders", value: data.totalFolders, icon: FolderOpen, color: "var(--success)" },
            { label: "Tags", value: data.totalTags, icon: Tags, color: "var(--warning)" },
          ].map((stat) => (
            <div key={stat.label} className="p-5 rounded-xl border" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: "var(--muted)" }}>{stat.label}</span>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl border" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <h3 className="font-semibold mb-4">Format Breakdown</h3>
            <div className="space-y-3">
              {data.formatBreakdown.map((f) => (
                <div key={f.format} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary-light)" }}>
                    {formatIcon[f.format] || <Image className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium capitalize w-20">{f.format}</span>
                  <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: "var(--tag-bg)" }}>
                    <div className="h-full rounded-full" style={{ background: "var(--primary)", width: `${(f.count / data.totalAds) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{f.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl border" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <h3 className="font-semibold mb-4">Top Advertisers</h3>
            <div className="space-y-3">
              {data.topAdvertisers.map((a, i) => (
                <div key={a.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-6" style={{ color: "var(--muted)" }}>#{i + 1}</span>
                  <span className="text-sm font-medium flex-1 truncate">{a.name}</span>
                  <div className="w-32 h-5 rounded-full overflow-hidden" style={{ background: "var(--tag-bg)" }}>
                    <div className="h-full rounded-full" style={{ background: "var(--primary)", width: `${(a.count / maxAdvCount) * 100}%` }} />
                  </div>
                  <span className="text-sm w-8 text-right">{a.count}</span>
                </div>
              ))}
              {data.topAdvertisers.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>No data yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <h3 className="font-semibold mb-4">Ad Status</h3>
          <div className="flex gap-6">
            {data.statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${s.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                <span className="text-sm capitalize">{s.status}</span>
                <span className="font-bold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
