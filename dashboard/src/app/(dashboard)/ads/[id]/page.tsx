"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Star,
  Tag,
  FolderOpen,
  Image as ImageIcon,
  Video,
  Layers,
  MessageSquare,
  Loader2,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  Link2,
  Clock,
  Monitor,
  Globe,
  Smartphone,
} from "lucide-react";
import toast from "react-hot-toast";
import { useStore } from "@/store";
import type { AdWithRelations } from "@/types";
import { formatDate } from "@/lib/utils";

const FORMAT_LABELS: Record<string, string> = {
  image: "Image",
  video: "Video",
  carousel: "Carousel",
  collection: "Collection",
};

const PLATFORM_ICONS: Record<string, { icon: string; color: string }> = {
  facebook: { icon: "f", color: "#1877F2" },
  instagram: { icon: "📷", color: "#E4405F" },
  messenger: { icon: "💬", color: "#0084FF" },
  threads: { icon: "🧵", color: "#000000" },
  audience_network: { icon: "🌐", color: "#4267B2" },
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
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    async function fetchAd() {
      const t = token || localStorage.getItem("token");
      if (!t || !params.id) return;
      try {
        const res = await fetch(`/api/ads/${params.id}`, {
          headers: { Authorization: `Bearer ${t}` },
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
    if (!ad) return;
    const t = token || localStorage.getItem("token");
    try {
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !ad.starred }),
      });
      if (res.ok) setAd({ ...ad, starred: !ad.starred });
    } catch {}
  }

  async function handleDelete() {
    if (!ad) return;
    if (!confirm("Delete this ad?")) return;
    const t = token || localStorage.getItem("token");
    try {
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) { toast.success("Deleted"); router.push("/dashboard"); }
    } catch { toast.error("Failed to delete"); }
  }

  async function handleAddNote() {
    if (!ad || !newNote.trim()) return;
    setSubmittingNote(true);
    const t = token || localStorage.getItem("token");
    try {
      const res = await fetch(`/api/ads/${ad.id}/notes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        const note = await res.json();
        setAd({ ...ad, notes: [...(ad.notes || []), note] });
        setNewNote("");
      }
    } catch {}
    finally { setSubmittingNote(false); }
  }

  const daysRunning = ad?.adStartDate
    ? Math.ceil((new Date(ad.adEndDate || new Date()).getTime() - new Date(ad.adStartDate).getTime()) / 86400000)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h2 className="text-lg font-medium text-gray-900">{error || "Ad not found"}</h2>
        <Link href="/dashboard" className="mt-4 text-sm text-indigo-600 hover:text-indigo-700">← Back to dashboard</Link>
      </div>
    );
  }

  const primaryTextLong = ad.primaryText && ad.primaryText.length > 180;
  const platforms = Array.isArray(ad.platforms) ? ad.platforms : ad.platforms ? [ad.platforms] : [];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft size={14} /> Previous
          </button>
        </div>

        <div className="flex items-center gap-4">
          {ad.adLibraryId && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-mono text-xs">ID: {ad.adLibraryId}</span>
              <a
                href={`https://www.facebook.com/ads/library/?id=${ad.adLibraryId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-indigo-600"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-400">
            <MessageSquare size={13} />
            <span className="text-xs">{ad.notes?.length || 0}</span>
          </div>
        </div>

        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          Next <ArrowRight size={14} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Ad Preview */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center" style={{ maxWidth: '60%' }}>
          <div className="w-full max-w-lg">
            {/* Ad Card */}
            <div
              className="rounded-lg bg-white overflow-hidden"
              style={{
                boxShadow: 'rgba(24,48,123,0.04) 0px 0px 0px 1px, rgba(26,48,84,0.04) 0px 1px 1px -0.5px, rgba(26,48,84,0.03) 0px 2px 2px -1px, rgba(26,48,84,0.03) 0px 3px 3px -1.5px'
              }}
            >
              {/* Card header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-semibold text-white">
                  {ad.advertiserName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-gray-900">{ad.advertiserName}</p>
                </div>
                {daysRunning !== null && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {daysRunning}D
                  </span>
                )}
              </div>

              {/* Primary text */}
              {ad.primaryText && (
                <div className="px-4 pb-3">
                  <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {textExpanded || !primaryTextLong
                      ? ad.primaryText
                      : ad.primaryText.slice(0, 180) + '...'}
                  </p>
                  {primaryTextLong && (
                    <button
                      onClick={() => setTextExpanded(!textExpanded)}
                      className="mt-1 text-[13px] font-medium text-gray-500 hover:text-gray-700 underline decoration-dotted"
                    >
                      {textExpanded ? 'Show less' : 'Read More'}
                    </button>
                  )}
                </div>
              )}

              {/* Creative */}
              <div className="relative bg-gray-50">
                {ad.format === "video" && ad.videoUrl ? (
                  <video src={ad.videoUrl} controls className="w-full" poster={ad.screenshotUrl || undefined} />
                ) : ad.creativeUrl ? (
                  <img src={ad.creativeUrl} alt={ad.headline || ad.advertiserName} className="w-full" />
                ) : ad.screenshotUrl ? (
                  <img src={ad.screenshotUrl} alt={ad.headline || ad.advertiserName} className="w-full" />
                ) : (
                  <div className="flex aspect-video items-center justify-center">
                    <ImageIcon size={48} className="text-gray-200" />
                  </div>
                )}
              </div>

              {/* Carousel */}
              {ad.format === "carousel" && ad.carouselCards?.length > 0 && (
                <div className="p-3 flex gap-2 overflow-x-auto">
                  {ad.carouselCards.sort((a: any, b: any) => a.position - b.position).map((card: any) => (
                    <div key={card.id} className="w-28 shrink-0 rounded border border-gray-200 overflow-hidden">
                      {card.imageUrl && <img src={card.imageUrl} className="aspect-square w-full object-cover" />}
                      {card.headline && <p className="p-1 text-[10px] text-gray-700 truncate">{card.headline}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Destination footer */}
              {(ad.displayUrl || ad.destinationUrl || ad.headline) && (
                <div className="border-t border-gray-100 px-4 py-3">
                  {ad.displayUrl && (
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide">{new URL(ad.destinationUrl || ad.displayUrl || '').hostname.replace('www.', '')}</p>
                  )}
                  {ad.headline && <p className="text-[13px] font-medium text-gray-900 mt-0.5">{ad.headline}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Details Panel */}
        <div className="w-[380px] shrink-0 border-l border-gray-200 overflow-y-auto bg-white">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-4">
            {["Details", "Comments"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-3 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                  activeTab === tab.toLowerCase()
                    ? 'border-indigo-600 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "details" ? (
            <div className="p-4 space-y-4">
              {/* Boards */}
              <DetailSection label="Boards">
                {ad.folders?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {ad.folders.map((f: any) => {
                      const folder = f.folder || f;
                      return (
                        <span key={folder.id} className="inline-flex items-center gap-1.5 rounded bg-gray-100 pl-2 pr-1.5 py-1 text-xs text-gray-700">
                          <FolderOpen size={11} className="text-gray-400" />
                          {folder.name}
                          <button className="text-gray-400 hover:text-gray-600 ml-0.5">×</button>
                        </span>
                      );
                    })}
                  </div>
                ) : <span className="text-xs text-gray-400">—</span>}
              </DetailSection>

              {/* Rating */}
              <DetailSection label="Rating">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} size={16} className="text-gray-300 hover:text-amber-400 cursor-pointer transition-colors" />
                  ))}
                </div>
              </DetailSection>

              {/* Tags */}
              <DetailSection label="Tags">
                {ad.tags?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {ad.tags.map((t: any) => {
                      const tag = t.tag || t;
                      return (
                        <span key={tag.id} className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `${tag.color || '#6366f1'}15`, color: tag.color || '#6366f1' }}>
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Add a Tag..."
                    className="w-full text-xs text-gray-500 bg-transparent outline-none placeholder:text-gray-400"
                  />
                )}
              </DetailSection>

              <div className="border-t border-gray-100" />

              {/* Info rows */}
              <InfoRow label="Brand" value={
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-[10px] font-semibold text-white">
                    {ad.advertiserName?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-[13px] font-medium text-gray-900">{ad.advertiserName}</span>
                </div>
              } />

              <InfoRow label="Saved By" value={
                <span className="text-[13px] text-gray-700">{formatDate(ad.savedAt)}</span>
              } />

              <InfoRow label="Status" value={
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${ad.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-[13px] font-medium text-gray-900">
                    {ad.status === 'active' ? 'Still Running' : 'Inactive'}
                  </span>
                  {ad.adStartDate && (
                    <span className="text-[12px] text-gray-400 ml-1">from {formatDate(ad.adStartDate)}</span>
                  )}
                </span>
              } />

              {daysRunning !== null && (
                <InfoRow label="Time Running" value={
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-gray-400" />
                    <span className="text-[13px] font-semibold text-gray-900">{daysRunning} Days</span>
                  </span>
                } />
              )}

              <InfoRow label="Format" value={
                <span className="flex items-center gap-1.5">
                  {ad.format === 'video' ? <Video size={13} className="text-gray-400" /> : <Monitor size={13} className="text-gray-400" />}
                  <span className="text-[13px] font-medium text-gray-900 capitalize">{FORMAT_LABELS[ad.format] || ad.format}</span>
                </span>
              } />

              {platforms.length > 0 && (
                <InfoRow label="Platforms" value={
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((p: string) => (
                      <span key={p} className="flex items-center gap-1 text-[13px] text-gray-700 capitalize">
                        <Globe size={13} className="text-gray-400" />
                        {p}
                      </span>
                    ))}
                  </div>
                } />
              )}

              {ad.destinationUrl && (
                <InfoRow label="Landing Page" value={
                  <a href={ad.destinationUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[12px] text-indigo-600 hover:underline truncate max-w-[200px]">
                    <Link2 size={11} />
                    {ad.destinationUrl.replace(/^https?:\/\//, '').substring(0, 35)}...
                  </a>
                } />
              )}
            </div>
          ) : (
            /* Comments Tab */
            <div className="p-4">
              <div className="space-y-3">
                {ad.notes?.map((note: any) => (
                  <div key={note.id} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-gray-800">{note.content}</p>
                    <p className="mt-1 text-[11px] text-gray-400">{note.user?.name || "You"} · {formatDate(note.createdAt)}</p>
                  </div>
                ))}
                {(!ad.notes || ad.notes.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-8">No comments yet</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  onKeyDown={(e) => { if (e.key === "Enter" && newNote.trim()) handleAddNote(); }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || submittingNote}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-center gap-6 mt-auto">
            <button onClick={handleDelete} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
            {ad.creativeUrl && (
              <a href={ad.creativeUrl} download target="_blank" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors">
                <Download size={14} /> Thumbnail
              </a>
            )}
            {ad.videoUrl && (
              <a href={ad.videoUrl} download target="_blank" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors">
                <Download size={14} /> Video
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[13px] text-gray-500 shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-[13px] text-gray-500 shrink-0">{label}</span>
      <div>{value}</div>
    </div>
  );
}
