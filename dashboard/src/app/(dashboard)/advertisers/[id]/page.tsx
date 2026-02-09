"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Image as ImageIcon,
  Video,
  Layers,
  Star,
  Loader2,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
} from "lucide-react";
import { useStore } from "@/store";
import type { AdWithRelations } from "@/types";
import { formatDate, truncateText } from "@/lib/utils";

export default function AdvertiserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useStore((s) => s.token);

  const [ads, setAds] = useState<AdWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const advertiserId = decodeURIComponent(params.id as string);

  const fetchAds = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `/api/ads?advertiserName=${encodeURIComponent(advertiserId)}&limit=200`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setAds(data.data || []);
      } else {
        setError("Advertiser not found");
      }
    } catch {
      setError("Failed to load advertiser data");
    } finally {
      setLoading(false);
    }
  }, [token, advertiserId]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h2 className="text-xl font-semibold text-gray-900">{error}</h2>
        <Link
          href="/advertisers"
          className="mt-4 flex items-center gap-2 text-sm text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to advertisers
        </Link>
      </div>
    );
  }

  const advertiserName = ads[0]?.advertiserName || advertiserId;
  const totalAds = ads.length;
  const activeAds = ads.filter((a) => a.status === "active").length;
  const inactiveAds = totalAds - activeAds;

  // Format breakdown
  const formatCounts: Record<string, number> = {};
  ads.forEach((ad) => {
    formatCounts[ad.format] = (formatCounts[ad.format] || 0) + 1;
  });

  // CTA distribution
  const ctaCounts: Record<string, number> = {};
  ads.forEach((ad) => {
    if (ad.ctaType) {
      ctaCounts[ad.ctaType] = (ctaCounts[ad.ctaType] || 0) + 1;
    }
  });

  // Timeline: group ads by month
  const timeline: Record<string, number> = {};
  ads.forEach((ad) => {
    const date = ad.adStartDate || ad.savedAt;
    if (date) {
      const month = new Date(date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      timeline[month] = (timeline[month] || 0) + 1;
    }
  });
  const timelineEntries = Object.entries(timeline).slice(-12);
  const maxTimelineCount = Math.max(...timelineEntries.map(([, c]) => c), 1);

  const formatColors: Record<string, string> = {
    image: "#6366f1",
    video: "#ec4899",
    carousel: "#f59e0b",
    collection: "#22c55e",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
            <Building2 size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {advertiserName}
            </h1>
            <p className="text-sm text-gray-500">
              {totalAds} ads saved
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Ads</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {totalAds}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">
            {activeAds}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="mt-1 text-3xl font-bold text-gray-400">
            {inactiveAds}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Formats Used</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {Object.keys(formatCounts).length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Format Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <PieChart size={18} />
            Format Breakdown
          </h2>
          <div className="mt-4 space-y-3">
            {Object.entries(formatCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([format, count]) => {
                const pct =
                  totalAds > 0
                    ? Math.round((count / totalAds) * 100)
                    : 0;
                return (
                  <div key={format}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium text-gray-700">
                        {format}
                      </span>
                      <span className="text-gray-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all"
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
            CTA Distribution
          </h2>
          {Object.keys(ctaCounts).length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No CTA data available
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {Object.entries(ctaCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([cta, count]) => {
                  const pct =
                    totalAds > 0
                      ? Math.round((count / totalAds) * 100)
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
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
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

      {/* Ad Timeline */}
      {timelineEntries.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Calendar size={18} />
            Ad Timeline
          </h2>
          <div className="mt-4 flex items-end gap-2">
            {timelineEntries.map(([month, count]) => (
              <div key={month} className="flex flex-1 flex-col items-center">
                <span className="mb-1 text-xs font-medium text-gray-700">
                  {count}
                </span>
                <div
                  className="w-full rounded-t bg-indigo-500 transition-all"
                  style={{
                    height: `${Math.max(
                      (count / maxTimelineCount) * 120,
                      4
                    )}px`,
                  }}
                />
                <span className="mt-2 text-[10px] text-gray-500">
                  {month}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Ads Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          All Ads ({totalAds})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ads.map((ad) => (
            <Link
              key={ad.id}
              href={`/ads/${ad.id}`}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md"
            >
              <div className="relative aspect-video bg-gray-100">
                {ad.creativeUrl || ad.screenshotUrl ? (
                  <img
                    src={ad.creativeUrl || ad.screenshotUrl || ""}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon size={24} className="text-gray-300" />
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs capitalize text-white">
                  {ad.format}
                </span>
                <span
                  className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                    ad.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ad.status}
                </span>
                {ad.starred && (
                  <Star
                    size={14}
                    className="absolute right-2 bottom-2 text-yellow-400"
                    fill="currentColor"
                  />
                )}
              </div>
              <div className="p-3">
                {ad.headline && (
                  <p className="truncate text-sm font-medium text-gray-900">
                    {ad.headline}
                  </p>
                )}
                {ad.primaryText && (
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {ad.primaryText}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  {ad.ctaType && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                      {ad.ctaType.replace(/_/g, " ")}
                    </span>
                  )}
                  <span>{formatDate(ad.adStartDate || ad.savedAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
