"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Calendar,
  Globe,
  Tag,
  FolderOpen,
  Image as ImageIcon,
  Video,
  Layers,
  MessageSquare,
  Loader2,
  Copy,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useStore } from "@/store";
import type { AdWithRelations } from "@/types";
import { formatDate } from "@/lib/utils";

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  image: <ImageIcon size={16} />,
  video: <Video size={16} />,
  carousel: <Layers size={16} />,
  collection: <Layers size={16} />,
};

export default function AdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useStore((s) => s.token);
  const [ad, setAd] = useState<AdWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    async function fetchAd() {
      if (!token || !params.id) return;
      try {
        const res = await fetch(`/api/ads/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setError("Ad not found");
          return;
        }
        const data = await res.json();
        setAd(data);
      } catch {
        setError("Failed to load ad");
      } finally {
        setLoading(false);
      }
    }
    fetchAd();
  }, [token, params.id]);

  async function handleToggleStar() {
    if (!ad || !token) return;
    try {
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ starred: !ad.starred }),
      });
      if (res.ok) {
        setAd({ ...ad, starred: !ad.starred });
        toast.success(ad.starred ? "Removed from starred" : "Added to starred");
      }
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleAddNote() {
    if (!ad || !token || !newNote.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/ads/${ad.id}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        const note = await res.json();
        setAd({
          ...ad,
          notes: [...(ad.notes || []), note],
        });
        setNewNote("");
        toast.success("Note added");
      }
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSubmittingNote(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h2 className="text-xl font-semibold text-gray-900">
          {error || "Ad not found"}
        </h2>
        <Link
          href="/ads"
          className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft size={16} />
          Back to ads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleStar}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              ad.starred
                ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Star
              size={16}
              fill={ad.starred ? "currentColor" : "none"}
            />
            {ad.starred ? "Starred" : "Star"}
          </button>
          {ad.destinationUrl && (
            <a
              href={ad.destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink size={16} />
              Visit URL
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Creative Preview - Left Column */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {/* Creative */}
            <div className="relative bg-gray-100 flex items-center justify-center">
              {ad.format === "video" && ad.videoUrl ? (
                <video
                  src={ad.videoUrl}
                  controls
                  className="w-full max-h-[500px] object-contain"
                  poster={ad.screenshotUrl || undefined}
                />
              ) : ad.creativeUrl ? (
                <img
                  src={ad.creativeUrl}
                  alt={ad.headline || ad.advertiserName}
                  className="w-full max-h-[500px] object-contain"
                />
              ) : ad.screenshotUrl ? (
                <img
                  src={ad.screenshotUrl}
                  alt={ad.headline || ad.advertiserName}
                  className="w-full max-h-[500px] object-contain"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center">
                  <ImageIcon size={48} className="text-gray-300" />
                </div>
              )}
            </div>

            {/* Carousel Cards */}
            {ad.format === "carousel" &&
              ad.carouselCards &&
              ad.carouselCards.length > 0 && (
                <div className="border-t border-gray-200 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">
                    Carousel Cards ({ad.carouselCards.length})
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {ad.carouselCards
                      .sort((a, b) => a.position - b.position)
                      .map((card) => (
                        <div
                          key={card.id}
                          className="w-48 shrink-0 overflow-hidden rounded-lg border border-gray-200"
                        >
                          {card.imageUrl ? (
                            <img
                              src={card.imageUrl}
                              alt={card.headline || ""}
                              className="aspect-square w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-square items-center justify-center bg-gray-100">
                              <ImageIcon
                                size={24}
                                className="text-gray-300"
                              />
                            </div>
                          )}
                          <div className="p-2">
                            {card.headline && (
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {card.headline}
                              </p>
                            )}
                            {card.description && (
                              <p className="mt-0.5 text-xs text-gray-500 truncate">
                                {card.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Ad Copy */}
            <div className="space-y-4 border-t border-gray-200 p-6">
              {ad.primaryText && (
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Primary Text
                    </h3>
                    <button
                      onClick={() =>
                        copyToClipboard(ad.primaryText!, "Primary text")
                      }
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {ad.primaryText}
                  </p>
                </div>
              )}
              {ad.headline && (
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Headline
                    </h3>
                    <button
                      onClick={() =>
                        copyToClipboard(ad.headline!, "Headline")
                      }
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {ad.headline}
                  </p>
                </div>
              )}
              {ad.description && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Description
                  </h3>
                  <p className="mt-1 text-sm text-gray-700">
                    {ad.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <MessageSquare size={18} />
              Notes ({ad.notes?.length || 0})
            </h3>
            <div className="mt-4 space-y-3">
              {ad.notes?.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg bg-gray-50 p-3"
                >
                  <p className="text-sm text-gray-800">{note.content}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>{note.user?.name || "Unknown"}</span>
                    <span>-</span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newNote.trim()) handleAddNote();
                }}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || submittingNote}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {submittingNote ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Add"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Metadata - Right Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Ad Info Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-base font-semibold text-gray-900">
              Ad Details
            </h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500">
                  Advertiser
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-indigo-600">
                  <Link href={`/advertisers/${ad.pageId || ad.advertiserName}`}>
                    {ad.advertiserName}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Format</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-sm capitalize text-gray-900">
                  {FORMAT_ICONS[ad.format]}
                  {ad.format}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Status</dt>
                <dd className="mt-0.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      ad.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {ad.status}
                  </span>
                </dd>
              </div>
              {ad.ctaType && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">
                    CTA Type
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900">
                    {ad.ctaType.replace(/_/g, " ")}
                  </dd>
                </div>
              )}
              {ad.destinationUrl && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">
                    Destination URL
                  </dt>
                  <dd className="mt-0.5 truncate text-sm text-indigo-600">
                    <a
                      href={ad.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {ad.displayUrl || ad.destinationUrl}
                    </a>
                  </dd>
                </div>
              )}
              {ad.adLibraryId && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">
                    Ad Library ID
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 font-mono">
                    {ad.adLibraryId}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Dates */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Calendar size={16} />
              Dates
            </h3>
            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-xs text-gray-500">Saved</dt>
                <dd className="text-sm text-gray-900">
                  {formatDate(ad.savedAt)}
                </dd>
              </div>
              {ad.adStartDate && (
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-gray-500">Ad Started</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(ad.adStartDate)}
                  </dd>
                </div>
              )}
              {ad.adEndDate && (
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-gray-500">Ad Ended</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(ad.adEndDate)}
                  </dd>
                </div>
              )}
              {ad.adStartDate && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    Running Time
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {Math.ceil(
                      (new Date(ad.adEndDate || new Date()).getTime() -
                        new Date(ad.adStartDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Platforms & Countries */}
          {(ad.platforms.length > 0 || ad.countries.length > 0) && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <Globe size={16} />
                Distribution
              </h3>
              {ad.platforms.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500">
                    Platforms
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {ad.platforms.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {ad.countries.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500">
                    Countries
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {ad.countries.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {ad.tags && ad.tags.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <Tag size={16} />
                Tags
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {ad.tags.map((t) => {
                  const tag = t.tag || t;
                  return (
                    <span
                      key={tag.id}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${tag.color || '#6366f1'}20`,
                        color: tag.color || '#6366f1',
                      }}
                    >
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Folders */}
          {ad.folders && ad.folders.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <FolderOpen size={16} />
                Folders
              </h3>
              <div className="mt-3 space-y-2">
                {ad.folders.map((f) => {
                  const folder = f.folder || f;
                  return (
                    <Link
                      key={folder.id}
                      href={`/dashboard/folders/${folder.id}`}
                      className="flex items-center gap-2 rounded-lg p-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FolderOpen size={14} className="text-gray-400" />
                      {folder.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
