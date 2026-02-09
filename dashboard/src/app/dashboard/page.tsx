"use client";

import { useState, useEffect, useCallback } from "react";
import AdCard from "@/components/ads/AdCard";
import { AdDetailModal } from "@/components/ads/AdDetailModal";
import EmptyState from "@/components/ui/EmptyState";
import { LayoutGrid, List, Plus, Search, SlidersHorizontal } from "lucide-react";

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
  displayUrl?: string | null;
  creativeUrl?: string | null;
  videoUrl?: string | null;
  screenshotUrl?: string | null;
  platforms?: string | null;
  countries?: string | null;
  adStartDate?: string | null;
  adEndDate?: string | null;
  starred: boolean;
  savedAt: string;
  adLibraryId?: string | null;
  pageId?: string | null;
  tags?: { id: string; name: string; color: string }[];
  folders?: { id: string; name: string }[];
  notes?: { id: string; content: string; createdAt: string; user?: { name: string | null } }[];
  carouselCards?: { id: string; position: number; imageUrl?: string | null; headline?: string | null; description?: string | null; url?: string | null }[];
}

export default function DashboardPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Record<string, string>>({});

  const fetchAds = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      if (search) params.set("search", search);

      const res = await fetch(`/api/ads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAds(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch ads:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const handleStar = async (id: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/ads/${id}/star`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setAds((prev) => prev.map((a) => (a.id === id ? { ...a, starred: !a.starred } : a)));
      if (selectedAd?.id === id) setSelectedAd((prev) => prev ? { ...prev, starred: !prev.starred } : null);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdClick = async (id: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/ads/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setSelectedAd(data.data || data.ad || data);
      setModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}
      >
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>All Ads</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{total} saved ads</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "var(--primary)" }}
          >
            <Plus className="w-4 h-4" /> Add Ad
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center flex-1 gap-2 px-3 py-2 rounded-lg" style={{ border: "1px solid var(--border)", background: "var(--sidebar-bg)" }}>
          <Search className="w-4 h-4" style={{ color: "var(--muted)" }} />
          <input
            type="text"
            placeholder="Search ads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--foreground)" }}
          />
        </div>

        <select
          className="px-3 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)" }}
          onChange={(e) => setFilters(prev => ({ ...prev, format: e.target.value }))}
        >
          <option value="">All Formats</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="carousel">Carousel</option>
        </select>

        <select
          className="px-3 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)" }}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="paused">Paused</option>
        </select>

        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <button
            onClick={() => setView("grid")}
            className="px-2.5 py-2 transition-colors"
            style={{
              background: view === "grid" ? "var(--primary)" : "transparent",
              color: view === "grid" ? "#fff" : "var(--muted)",
            }}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            className="px-2.5 py-2 transition-colors"
            style={{
              background: view === "list" ? "var(--primary)" : "transparent",
              color: view === "list" ? "#fff" : "var(--muted)",
            }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border animate-pulse" style={{ borderColor: "var(--border)" }}>
                <div className="aspect-[4/3]" style={{ background: "var(--card-hover)" }} />
                <div className="p-3 space-y-2">
                  <div className="h-4 rounded" style={{ background: "var(--card-hover)", width: "60%" }} />
                  <div className="h-3 rounded" style={{ background: "var(--card-hover)", width: "80%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : ads.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="w-8 h-8" />}
            title="No ads saved yet"
            description="Install the Chrome extension and start saving ads from Meta Ads Library, or add ads manually."
            action={{ label: "Add Your First Ad", onClick: () => {} }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

      {/* Detail Modal */}
      {modalOpen && selectedAd && (
        <AdDetailModal
          ad={selectedAd as any}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
