"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  Image as ImageIcon,
  Video,
  Layers,
  Star,
  Tag,
  Building2,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useStore } from "@/store";

interface AnalyticsData {
  totalAds: number;
  totalFolders: number;
  totalTags: number;
  totalAdvertisers: number;
  formatBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  ctaBreakdown: Record<string, number>;
  topAdvertisers: { name: string; count: number }[];
  topTags: { name: string; color: string; count: number }[];
  adsByMonth: Record<string, number>;
  platformBreakdown: Record<string, number>;
  recentActivity: number;
}

export default function AnalyticsPage() {
  const token = useStore((s) => s.token);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      console.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <BarChart3 size={48} className="text-gray-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          No analytics data
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Save some ads to see analytics here
        </p>
      </div>
    );
  }

  const formatColors: Record<string, string> = {
    image: "#6366f1",
    video: "#ec4899",
    carousel: "#f59e0b",
    collection: "#22c55e",
  };

  const monthEntries = Object.entries(data.adsByMonth || {}).slice(-12);
  const maxMonthCount = Math.max(
    ...monthEntries.map(([, c]) => c),
    1
  );

  const activeCount = data.statusBreakdown?.active || 0;
  const inactiveCount = data.statusBreakdown?.inactive || 0;
  const activeRate =
    data.totalAds > 0
      ? Math.round((activeCount / data.totalAds) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Insights from your saved ad library
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-gray-500">
            <ImageIcon size={16} />
            <span className="text-sm">Total Ads</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {data.totalAds}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-gray-500">
            <Building2 size={16} />
            <span className="text-sm">Advertisers</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {data.totalAdvertisers}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-gray-500">
            <Tag size={16} />
            <span className="text-sm">Tags</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {data.totalTags}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-gray-500">
            <TrendingUp size={16} />
            <span className="text-sm">Active Rate</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {activeRate}%
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Format Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <PieChart size={18} />
            Format Distribution
          </h2>
          <div className="mt-4 space-y-3">
            {Object.entries(data.formatBreakdown || {})
              .sort(([, a], [, b]) => b - a)
              .map(([format, count]) => {
                const pct =
                  data.totalAds > 0
                    ? Math.round((count / data.totalAds) * 100)
                    : 0;
                return (
                  <div key={format}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-gray-700">
                        {format}
                      </span>
                      <span className="text-gray-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            formatColors[format] || "#9ca3af",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* CTA Distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <BarChart3 size={18} />
            CTA Types
          </h2>
          {Object.keys(data.ctaBreakdown || {}).length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No CTA data</p>
          ) : (
            <div className="mt-4 space-y-3">
              {Object.entries(data.ctaBreakdown || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([cta, count]) => {
                  const pct =
                    data.totalAds > 0
                      ? Math.round((count / data.totalAds) * 100)
                      : 0;
                  return (
                    <div key={cta}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">
                          {cta.replace(/_/g, " ")}
                        </span>
                        <span className="text-gray-500">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {monthEntries.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Calendar size={18} />
            Ads Over Time
          </h2>
          <div className="mt-6 flex items-end gap-2" style={{ height: 160 }}>
            {monthEntries.map(([month, count]) => (
              <div
                key={month}
                className="flex flex-1 flex-col items-center"
              >
                <span className="mb-1 text-xs font-medium text-gray-700">
                  {count}
                </span>
                <div
                  className="w-full rounded-t bg-indigo-500"
                  style={{
                    height: `${Math.max(
                      (count / maxMonthCount) * 120,
                      4
                    )}px`,
                  }}
                />
                <span className="mt-2 text-[10px] text-gray-500 text-center">
                  {month}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Advertisers */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Building2 size={18} />
            Top Advertisers
          </h2>
          {(data.topAdvertisers || []).length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No advertiser data
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {(data.topAdvertisers || [])
                .slice(0, 10)
                .map((adv, i) => (
                  <div
                    key={adv.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {adv.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {adv.count} ads
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Top Tags */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Tag size={18} />
            Popular Tags
          </h2>
          {(data.topTags || []).length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No tag data</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {(data.topTags || []).slice(0, 20).map((tag) => (
                <span
                  key={tag.name}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium"
                  style={{
                    backgroundColor: `${tag.color}15`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                  <span className="opacity-60">({tag.count})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platform Breakdown */}
      {Object.keys(data.platformBreakdown || {}).length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">
            Platform Distribution
          </h2>
          <div className="mt-4 flex flex-wrap gap-4">
            {Object.entries(data.platformBreakdown || {})
              .sort(([, a], [, b]) => b - a)
              .map(([platform, count]) => (
                <div
                  key={platform}
                  className="rounded-lg border border-gray-200 px-4 py-3 text-center"
                >
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">{platform}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
