"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Search,
  ArrowUpDown,
  Image as ImageIcon,
  Video,
  Layers,
  Loader2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store";

interface AdvertiserSummary {
  name: string;
  pageId: string | null;
  adCount: number;
  formats: Record<string, number>;
  activeCount: number;
  inactiveCount: number;
  latestSavedAt: string;
}

export default function AdvertisersPage() {
  const token = useStore((s) => s.token);
  const [advertisers, setAdvertisers] = useState<AdvertiserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"adCount" | "name">("adCount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchAdvertisers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/advertisers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdvertisers(data.data || data || []);
      }
    } catch {
      console.error("Failed to fetch advertisers");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAdvertisers();
  }, [fetchAdvertisers]);

  const filtered = advertisers
    .filter((a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "adCount") {
        return sortOrder === "desc"
          ? b.adCount - a.adCount
          : a.adCount - b.adCount;
      }
      return sortOrder === "desc"
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name);
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Advertisers</h1>
        <p className="mt-1 text-sm text-gray-500">
          {advertisers.length} advertiser
          {advertisers.length !== 1 ? "s" : ""} tracked
        </p>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search advertisers..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "adCount" | "name")
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="adCount">Sort by Ad Count</option>
            <option value="name">Sort by Name</option>
          </select>
          <button
            onClick={() =>
              setSortOrder(sortOrder === "desc" ? "asc" : "desc")
            }
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowUpDown size={14} />
            {sortOrder === "desc" ? "Desc" : "Asc"}
          </button>
        </div>
      </div>

      {/* Advertisers Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <Building2 size={48} className="text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No advertisers found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? "Try a different search term"
              : "Save some ads to see advertisers here"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((advertiser) => {
            const total = advertiser.adCount;
            const activeRatio =
              total > 0
                ? Math.round(
                    (advertiser.activeCount / total) * 100
                  )
                : 0;

            return (
              <Link
                key={advertiser.name}
                href={`/advertisers/${encodeURIComponent(
                  advertiser.pageId || advertiser.name
                )}`}
                className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-indigo-200 hover:shadow-md"
              >
                {/* Advertiser Name */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-gray-900">
                      {advertiser.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {total} ad{total !== 1 ? "s" : ""} saved
                    </p>
                  </div>
                </div>

                {/* Format Mini Chart */}
                <div className="mt-4 flex gap-1">
                  {Object.entries(advertiser.formats || {}).map(
                    ([format, count]) => {
                      const pct = total > 0 ? (count / total) * 100 : 0;
                      const colors: Record<string, string> = {
                        image: "#6366f1",
                        video: "#ec4899",
                        carousel: "#f59e0b",
                        collection: "#22c55e",
                      };
                      return (
                        <div
                          key={format}
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.max(pct, 5)}%`,
                            backgroundColor: colors[format] || "#9ca3af",
                          }}
                          title={`${format}: ${count}`}
                        />
                      );
                    }
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(advertiser.formats || {}).map(
                    ([format, count]) => (
                      <span
                        key={format}
                        className="text-xs capitalize text-gray-500"
                      >
                        {format}: {count}
                      </span>
                    )
                  )}
                </div>

                {/* Active/Inactive */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-gray-600">
                      {activeRatio}% active
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <TrendingUp size={12} />
                    <span>
                      {advertiser.activeCount} active /{" "}
                      {advertiser.inactiveCount} inactive
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
