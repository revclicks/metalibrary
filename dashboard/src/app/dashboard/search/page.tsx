"use client";

import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import AdCard from "@/components/ads/AdCard";
import { AdDetailModal } from "@/components/ads/AdDetailModal";
import EmptyState from "@/components/ui/EmptyState";
import { Search, Filter } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [format, setFormat] = useState("");
  const [status, setStatus] = useState("");

  const handleSearch = async () => {
    if (!query.trim() && !format && !status) return;
    setLoading(true);
    setSearched(true);
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (format) params.set("format", format);
    if (status) params.set("status", status);

    const res = await fetch(`/api/ads?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); setResults(data.ads); setTotal(data.total); }
    setLoading(false);
  };

  const handleAdClick = async (id: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/ads/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); setSelectedAd(data.ad); setModalOpen(true); }
  };

  return (
    <>
      <TopBar title="Search" subtitle="Find ads across your library" />
      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--muted)" }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search ad copy, headlines, advertisers, notes..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
              />
            </div>
            <button onClick={handleSearch} className="px-6 py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: "var(--primary)" }}>
              Search
            </button>
          </div>

          <div className="flex gap-2">
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              <option value="">All Formats</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="carousel">Carousel</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border animate-pulse" style={{ borderColor: "var(--card-border)" }}>
                <div className="aspect-[4/3]" style={{ background: "var(--card-hover)" }} />
                <div className="p-3 space-y-2"><div className="h-4 rounded" style={{ background: "var(--card-hover)", width: "60%" }} /></div>
              </div>
            ))}
          </div>
        ) : searched && results.length === 0 ? (
          <EmptyState icon={Search} title="No results found" description="Try different keywords or adjust your filters." />
        ) : searched ? (
          <>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{total} results found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {results.map((ad) => <AdCard key={ad.id} ad={ad} onToggleStar={() => {}} />)}
            </div>
          </>
        ) : (
          <EmptyState icon={Search} title="Search your ad library" description="Use the search bar above to find ads by text, advertiser, or notes." />
        )}
      </div>
      {modalOpen && selectedAd && <AdDetailModal ad={selectedAd} onClose={() => setModalOpen(false)} />}
    </>
  );
}
