"use client";

import { useState, useEffect, useCallback } from "react";
import AdCard from "@/components/ads/AdCard";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import {
  LayoutGrid,
  Search,
  SlidersHorizontal,
  Calendar,
  ArrowUpDown,
  Users,
  Bookmark,
  Eye,
  Grid3X3,
} from "lucide-react";

interface Ad {
  id: string;
  advertiserName: string;
  format: string;
  status: string;
  primaryText?: string | null;
  headline?: string | null;
  description?: string | null;
  ctaType?: string | null;
  destinationUrl?: string | null;
  creativeUrl?: string | null;
  videoUrl?: string | null;
  screenshotUrl?: string | null;
  starred: boolean;
  savedAt: string;
  adLibraryId?: string | null;
  adStartDate?: string | null;
  tags?: { id: string; name: string; color: string }[];
  folders?: { id: string; name: string }[];
  _count?: { notes: number };
}

export default function DashboardPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState("my-ads");

  const fetchAds = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (sortBy === "newest") {
        params.set("sortBy", "savedAt");
        params.set("sortOrder", "desc");
      }

      const res = await fetch(`/api/ads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAds(data.data || []);
        setTotal(data.pagination?.total || data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch ads:", err);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const handleStar = async (id: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/ads/${id}/star`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setAds((prev) => prev.map((a) => (a.id === id ? { ...a, starred: !a.starred } : a)));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#fff' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
            <Bookmark className="h-4 w-4 text-indigo-600" />
          </div>
          <h1 className="text-[15px] font-semibold text-gray-900">Swipe File</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
            />
            <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1">⌘K</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-6 px-6 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("my-ads")}
          className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "my-ads"
              ? "border-indigo-600 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="h-4 w-4" />
          My Ads
        </button>
        <Link
          href="/dashboard/advertisers"
          className="flex items-center gap-2 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Grid3X3 className="h-4 w-4" />
          Brands
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-100">
        <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Add Filter
        </button>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700">
            <Calendar className="h-3.5 w-3.5" />
            All Time
          </button>
          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Newest
          </button>
          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700">
            <Eye className="h-3.5 w-3.5" />
            On
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 py-5" style={{ background: '#fff' }}>
        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-white animate-pulse mb-4 break-inside-avoid"
                style={{ boxShadow: 'rgba(24,48,123,0.04) 0px 0px 0px 1px' }}
              >
                <div className="flex items-center gap-2 p-3">
                  <div className="h-8 w-8 rounded-full bg-gray-100" />
                  <div className="h-4 bg-gray-100 rounded w-24" />
                </div>
                <div className="h-52 bg-gray-50" />
                <div className="p-3">
                  <div className="h-3 bg-gray-100 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : ads.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="w-8 h-8" />}
            title="No ads saved yet"
            description="Install the Chrome extension and start saving ads from Meta Ads Library."
            action={{ label: "Get Chrome Extension", onClick: () => window.location.href = '/extension' }}
          />
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad as any}
                onToggleStar={handleStar}
                onSelect={handleSelect}
                isSelected={selectedIds.has(ad.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
