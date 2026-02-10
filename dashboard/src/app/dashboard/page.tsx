"use client";

import { useState, useEffect, useCallback } from "react";
import AdCard from "@/components/ads/AdCard";
import EmptyState from "@/components/ui/EmptyState";
import { LayoutGrid, Search, SlidersHorizontal, Calendar, ArrowUpDown } from "lucide-react";

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
  const [sortBy, setSortBy] = useState("savedAt");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const fetchAds = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      if (search) params.set("search", search);
      params.set("sortBy", sortBy);
      params.set("sortOrder", "desc");

      const res = await fetch(`/api/ads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAds(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch ads:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, search, sortBy]);

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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center flex-1 gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search ads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          <SlidersHorizontal className="w-4 h-4" />
          Add Filter
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            <Calendar className="w-4 h-4" />
            All Time
          </button>
          <select
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="savedAt">Newest</option>
            <option value="advertiserName">Advertiser</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white animate-pulse mb-4 break-inside-avoid">
                <div className="h-48 bg-gray-100 rounded-t-lg" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
