"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FolderOpen,
  Share2,
  Zap,
  Settings,
  Image as ImageIcon,
  Loader2,
  Link2,
  Copy,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import { useStore } from "@/store";
import type { FolderType, AdWithRelations } from "@/types";
import { formatDate, truncateText } from "@/lib/utils";

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useStore((s) => s.token);

  const [folder, setFolder] = useState<FolderType | null>(null);
  const [ads, setAds] = useState<AdWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAds, setLoadingAds] = useState(true);
  const [error, setError] = useState("");

  const fetchFolder = useCallback(async () => {
    if (!token || !params.id) return;
    try {
      const res = await fetch(`/api/folders/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("Folder not found");
        return;
      }
      const data = await res.json();
      setFolder(data);
    } catch {
      setError("Failed to load folder");
    } finally {
      setLoading(false);
    }
  }, [token, params.id]);

  const fetchAds = useCallback(async () => {
    if (!token || !params.id) return;
    setLoadingAds(true);
    try {
      const res = await fetch(`/api/ads?folderId=${params.id}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAds(data.data || []);
      }
    } catch {
      console.error("Failed to fetch folder ads");
    } finally {
      setLoadingAds(false);
    }
  }, [token, params.id]);

  useEffect(() => {
    fetchFolder();
    fetchAds();
  }, [fetchFolder, fetchAds]);

  async function handleToggleShare() {
    if (!folder || !token) return;
    try {
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isShared: !folder.isShared }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFolder(updated);
        toast.success(
          updated.isShared ? "Folder is now shared" : "Folder is now private"
        );
      }
    } catch {
      toast.error("Failed to update sharing");
    }
  }

  function copyShareLink() {
    if (folder?.shareLink) {
      navigator.clipboard.writeText(
        `${window.location.origin}/shared/${folder.shareLink}`
      );
      toast.success("Share link copied to clipboard");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !folder) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h2 className="text-xl font-semibold text-gray-900">
          {error || "Folder not found"}
        </h2>
        <Link
          href="/folders"
          className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft size={16} />
          Back to folders
        </Link>
      </div>
    );
  }

  const formatBreakdown = ["image", "video", "carousel", "collection"].map(
    (format) => ({
      format,
      count: ads.filter((a) => a.format === format).length,
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <FolderOpen size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {folder.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{ads.length} ads</span>
                {folder.isSmart && (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <Zap size={12} /> Smart
                  </span>
                )}
                {folder.isShared && (
                  <span className="inline-flex items-center gap-1 text-blue-600">
                    <Share2 size={12} /> Shared
                  </span>
                )}
                <span>Created {formatDate(folder.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleShare}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              folder.isShared
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Share2 size={14} />
            {folder.isShared ? "Shared" : "Share"}
          </button>
          {folder.isShared && folder.shareLink && (
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Link2 size={14} />
              Copy Link
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {formatBreakdown.map(({ format, count }) => (
          <div
            key={format}
            className="rounded-xl border border-gray-200 bg-white p-4 text-center"
          >
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="text-xs capitalize text-gray-500">{format}</p>
          </div>
        ))}
      </div>

      {/* Ads Grid */}
      {loadingAds ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="aspect-video rounded-lg bg-gray-200" />
              <div className="mt-3 h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <ImageIcon size={48} className="text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No ads in this folder
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add ads to this folder from the ads page
          </p>
        </div>
      ) : (
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
                <p className="text-xs font-medium text-indigo-600">
                  {ad.advertiserName}
                </p>
                {ad.headline && (
                  <p className="mt-0.5 truncate text-sm font-medium text-gray-900">
                    {ad.headline}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span className="capitalize">{ad.format}</span>
                  <span>{formatDate(ad.savedAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
