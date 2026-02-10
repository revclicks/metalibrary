"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Globe,
  Tag,
  FolderOpen,
  Image as ImageIcon,
  Video,
  Layers,
  MessageSquare,
  Loader2,
  Copy,
  Trash2,
  Download,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { useStore } from "@/store";
import type { AdWithRelations } from "@/types";
import { formatDate, formatRelativeDate } from "@/lib/utils";

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  image: <ImageIcon size={14} />,
  video: <Video size={14} />,
  carousel: <Layers size={14} />,
  collection: <Layers size={14} />,
};

const PLATFORM_ICONS: Record<string, string> = {
  facebook: "📘",
  instagram: "📷",
  messenger: "💬",
  audience_network: "🌐",
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
  const [textExpanded, setTextExpanded] = useState(false);

  useEffect(() => {
    async function fetchAd() {
      if (!token || !params.id) return;
      try {
        const res = await fetch(`/api/ads/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setError("Ad not found"); return; }
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
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !ad.starred }),
      });
      if (res.ok) {
        setAd({ ...ad, starred: !ad.starred });
        toast.success(ad.starred ? "Removed from starred" : "Added to starred");
      }
    } catch { toast.error("Failed to update"); }
  }

  async function handleDelete() {
    if (!ad || !token) return;
    if (!confirm("Are you sure you want to delete this ad?")) return;
    try {
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Ad deleted");
        router.push("/dashboard");
      }
    } catch { toast.error("Failed to delete"); }
  }

  async function handleAddNote() {
    if (!ad || !token || !newNote.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/ads/${ad.id}/notes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        const note = await res.json();
        setAd({ ...ad, notes: [...(ad.notes || []), note] });
        setNewNote("");
        toast.success("Note added");
      }
    } catch { toast.error("Failed to add note"); }
    finally { setSubmittingNote(false); }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  const daysRunning = ad?.adStartDate
    ? Math.ceil((new Date(ad.adEndDate || new Date()).getTime() - new Date(ad.adStartDate).getTime()) / 86400000)
    : null;

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
        <h2 className="text-xl font-semibold text-gray-900">{error || "Ad not found"}</h2>
        <Link href="/dashboard" className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </div>
    );
  }

  const primaryTextTruncated = ad.primaryText && ad.primaryText.length > 200;

  return (
    <div className="min-h-full bg-white">
      {/* Back bar */}
      <div className="border-b border-gray-200 px-6 py-3">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 lg:gap-0">
        {/* LEFT: Ad Preview Card */}
        <div className="flex-1 lg:max-w-[55%] border-r border-gray-200 p-6">
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
            {/* Card header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                {ad.advertiserName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{ad.advertiserName}</p>
                {ad.adStartDate && (
                  <p className="text-xs text-gray-400">
                    {daysRunning} days active · {ad.status === 'active' ? '🟢 Still running' : '⚪ Inactive'}
                  </p>
                )}
              </div>
              <button onClick={handleToggleStar} className="p-1">
                <Star size={16} className={ad.starred ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
              </button>
            </div>

            {/* Primary text with Read More */}
            {ad.primaryText && (
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {textExpanded || !primaryTextTruncated
                    ? ad.primaryText
                    : ad.primaryText.slice(0, 200) + '...'}
                </p>
                {primaryTextTruncated && (
                  <button
                    onClick={() => setTextExpanded(!textExpanded)}
                    className="mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                  >
                    {textExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
                  </button>
                )}
              </div>
            )}

            {/* Creative media */}
            <div className="relative bg-gray-50">
              {ad.format === "video" && ad.videoUrl ? (
                <video src={ad.videoUrl} controls className="w-full max-h-[500px] object-contain" poster={ad.screenshotUrl || undefined} />
              ) : ad.creativeUrl ? (
                <img src={ad.creativeUrl} alt={ad.headline || ad.advertiserName} className="w-full max-h-[500px] object-contain" />
              ) : ad.screenshotUrl ? (
                <img src={ad.screenshotUrl} alt={ad.headline || ad.advertiserName} className="w-full max-h-[500px] object-contain" />
              ) : (
                <div className="flex aspect-video items-center justify-center"><ImageIcon size={48} className="text-gray-200" /></div>
              )}
            </div>

            {/* Carousel */}
            {ad.format === "carousel" && ad.carouselCards?.length > 0 && (
              <div className="border-t border-gray-100 p-4">
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {ad.carouselCards.sort((a, b) => a.position - b.position).map((card) => (
                    <div key={card.id} className="w-32 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.headline || ""} className="aspect-square w-full object-cover" />
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-gray-50"><ImageIcon size={20} className="text-gray-200" /></div>
                      )}
                      {card.headline && <p className="p-1.5 text-[10px] font-medium text-gray-900 truncate">{card.headline}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Destination URL footer */}
            {(ad.headline || ad.destinationUrl) && (
              <div className="border-t border-gray-100 px-4 py-3">
                {ad.headline && <p className="text-sm font-semibold text-gray-900">{ad.headline}</p>}
                {ad.description && <p className="text-xs text-gray-500 mt-0.5">{ad.description}</p>}
                {ad.destinationUrl && (
                  <a href={ad.destinationUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline mt-1 inline-block truncate max-w-full">
                    {ad.displayUrl || ad.destinationUrl}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <MessageSquare size={14} /> Notes ({ad.notes?.length || 0})
            </h3>
            <div className="mt-3 space-y-2">
              {ad.notes?.map((note) => (
                <div key={note.id} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm text-gray-800">{note.content}</p>
                  <p className="mt-1 text-xs text-gray-400">{note.user?.name || "You"} · {formatDate(note.createdAt)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30"
                onKeyDown={(e) => { if (e.key === "Enter" && newNote.trim()) handleAddNote(); }}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || submittingNote}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submittingNote ? <Loader2 size={14} className="animate-spin" /> : "Add"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Details Panel */}
        <div className="flex-1 p-6 space-y-5">
          {/* Boards/Folders */}
          <DetailSection title="Boards" icon={<FolderOpen size={14} />}>
            {ad.folders?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {ad.folders.map((f) => {
                  const folder = (f as any).folder || f;
                  return (
                    <Link key={folder.id} href={`/dashboard/folders/${folder.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200">
                      <FolderOpen size={10} /> {folder.name}
                    </Link>
                  );
                })}
              </div>
            ) : <p className="text-xs text-gray-400">No boards</p>}
          </DetailSection>

          {/* Tags */}
          <DetailSection title="Tags" icon={<Tag size={14} />}>
            {ad.tags?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {ad.tags.map((t) => {
                  const tag = (t as any).tag || t;
                  return (
                    <span key={tag.id} className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: `${tag.color || '#6366f1'}15`, color: tag.color || '#6366f1' }}>
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            ) : <p className="text-xs text-gray-400">No tags</p>}
          </DetailSection>

          {/* Details Grid */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <DetailRow label="Brand" value={ad.advertiserName} />
            <DetailRow label="Status" value={
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${ad.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${ad.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                {ad.status === 'active' ? 'Still running' : 'Inactive'}
              </span>
            } />
            {daysRunning !== null && <DetailRow label="Time Running" value={`${daysRunning} days`} />}
            <DetailRow label="Format" value={
              <span className="inline-flex items-center gap-1 text-xs capitalize">
                {FORMAT_ICONS[ad.format]} {ad.format}
              </span>
            } />
            {ad.platforms?.length > 0 && (
              <DetailRow label="Platforms" value={
                <div className="flex flex-wrap gap-1">
                  {ad.platforms.map((p) => (
                    <span key={p} className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                      {PLATFORM_ICONS[p] || '🌐'} {p}
                    </span>
                  ))}
                </div>
              } />
            )}
            {ad.countries?.length > 0 && (
              <DetailRow label="Countries" value={
                <div className="flex flex-wrap gap-1">
                  {ad.countries.map((c) => (
                    <span key={c} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{c}</span>
                  ))}
                </div>
              } />
            )}
            <DetailRow label="Saved" value={formatDate(ad.savedAt)} />
            {ad.adStartDate && <DetailRow label="Ad Started" value={formatDate(ad.adStartDate)} />}
            {ad.adLibraryId && (
              <DetailRow label="Ad Library ID" value={
                <span className="font-mono text-[10px] text-gray-500">{ad.adLibraryId}</span>
              } />
            )}
            {ad.destinationUrl && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Landing Page</p>
                <a href={ad.destinationUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-indigo-500 hover:underline break-all flex items-center gap-1">
                  <ExternalLink size={10} /> {ad.displayUrl || ad.destinationUrl}
                </a>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100">
              <Trash2 size={12} /> Delete
            </button>
            {ad.creativeUrl && (
              <a href={ad.creativeUrl} download target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <Download size={12} /> Download Thumbnail
              </a>
            )}
            {ad.videoUrl && (
              <a href={ad.videoUrl} download target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <Download size={12} /> Download Video
              </a>
            )}
            {ad.destinationUrl && (
              <a href={ad.destinationUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <ExternalLink size={12} /> Visit Landing Page
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-xs text-gray-900 text-right">{value}</span>
    </div>
  );
}
