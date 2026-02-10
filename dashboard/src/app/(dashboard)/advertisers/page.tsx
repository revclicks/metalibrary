"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Heart, ExternalLink, Users, ArrowUpDown, SlidersHorizontal, Bookmark, Grid3X3 } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface Advertiser {
  advertiserName: string;
  adCount: number;
  activeAds: number;
  topFormat: string;
  lastSavedAt: string;
  isFollowed?: boolean;
}

export default function AdvertisersPage() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortAZ, setSortAZ] = useState(true);

  useEffect(() => {
    const fetchAdvertisers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/advertisers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAdvertisers(Array.isArray(data) ? data : data.data || data.advertisers || []);
        }
      } catch (err) {
        console.error("Failed to fetch advertisers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdvertisers();
  }, []);

  const filtered = advertisers
    .filter((a) => !search || a.advertiserName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortAZ ? a.advertiserName.localeCompare(b.advertiserName) : b.advertiserName.localeCompare(a.advertiserName));

  return (
    <div className="flex flex-col h-full bg-white">
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
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-6 px-6 border-b border-gray-100">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Users className="h-4 w-4" />
          My Ads
        </Link>
        <button
          className="flex items-center gap-2 py-3 text-sm font-medium border-b-2 border-indigo-600 text-gray-900"
        >
          <Grid3X3 className="h-4 w-4" />
          Brands
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-100">
        <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Add Filter
        </button>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700">
            <Heart className="h-3.5 w-3.5" />
            Favorites
          </button>
          <button
            onClick={() => setSortAZ(!sortAZ)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortAZ ? "A-Z" : "Z-A"}
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-gray-400 text-xs">i</span>
          Only brands whose ads you have saved will be displayed here.
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="px-6 py-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-gray-100" />
                <div className="h-4 bg-gray-100 rounded w-32" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title={search ? "No brands found" : "No brands yet"}
              description={search ? "Try a different search term." : "Save ads from the Meta Ads Library to see brands here."}
            />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brands</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ads Saved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Format</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((adv) => (
                <tr key={adv.advertiserName} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-semibold text-white">
                        {adv.advertiserName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{adv.advertiserName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-sm text-gray-600">{adv.adCount}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-sm text-gray-500 capitalize">{adv.topFormat || '—'}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                        <Heart className="h-4 w-4" />
                      </button>
                      <a
                        href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(adv.advertiserName)}`}
                        target="_blank"
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                      >
                        Ad Library <ExternalLink className="h-3 w-3" />
                      </a>
                      <Link
                        href={`/dashboard?advertiser=${encodeURIComponent(adv.advertiserName)}`}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                      >
                        View Ads <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
