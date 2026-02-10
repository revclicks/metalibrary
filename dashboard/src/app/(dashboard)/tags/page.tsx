"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import EmptyState from "@/components/ui/EmptyState";
import { Tags, Plus, Trash2, Edit2, X } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  color: string;
  group: string | null;
  _count: { adTags: number };
}

const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#6b7280"];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newGroup, setNewGroup] = useState("");

  const fetchTags = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/tags", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); setTags(Array.isArray(data) ? data : data.tags || data.data || []); }
    setLoading(false);
  };

  useEffect(() => { fetchTags(); }, []);

  const createTag = async () => {
    if (!newName.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName, color: newColor, group: newGroup || undefined }),
    });
    if (res.ok) { setNewName(""); setShowCreate(false); fetchTags(); }
  };

  const deleteTag = async (id: string) => {
    const token = localStorage.getItem("token");
    await fetch(`/api/tags/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchTags();
  };

  const groups = [...new Set(tags.map((t) => t.group).filter(Boolean))] as string[];

  return (
    <>
      <TopBar
        title="Tags"
        subtitle={`${tags.length} tags`}
        actions={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm font-medium" style={{ background: "var(--primary)" }}>
            <Plus className="w-4 h-4" /> New Tag
          </button>
        }
      />
      <div className="p-6">
        {showCreate && (
          <div className="mb-4 p-4 rounded-xl border space-y-3" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tag name..."
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--background)" }}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && createTag()}
              />
              <input
                type="text"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                placeholder="Group (optional)"
                className="w-40 px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--background)" }}
              />
            </div>
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${newColor === c ? "border-white ring-2" : "border-transparent"}`}
                  style={{ background: c, outlineColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={createTag} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "var(--primary)" }}>Create</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--card-border)" }}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-full animate-pulse" style={{ background: "var(--card-hover)" }} />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <EmptyState icon={Tags} title="No tags yet" description="Create tags to categorize your saved ads." action={{ label: "Create Tag", onClick: () => setShowCreate(true) }} />
        ) : (
          <div className="space-y-6">
            {groups.length > 0 && groups.map((group) => (
              <div key={group}>
                <h3 className="text-sm font-semibold mb-2 uppercase" style={{ color: "var(--muted)" }}>{group}</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.filter((t) => t.group === group).map((tag) => (
                    <div key={tag.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium group" style={{ background: tag.color + "20", color: tag.color }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: tag.color }} />
                      {tag.name}
                      <span className="text-xs opacity-60">({tag._count.adTags})</span>
                      <button onClick={() => deleteTag(tag.id)} className="opacity-0 group-hover:opacity-100 ml-1"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div>
              {groups.length > 0 && <h3 className="text-sm font-semibold mb-2 uppercase" style={{ color: "var(--muted)" }}>Ungrouped</h3>}
              <div className="flex flex-wrap gap-2">
                {tags.filter((t) => !t.group).map((tag) => (
                  <div key={tag.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium group" style={{ background: tag.color + "20", color: tag.color }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: tag.color }} />
                    {tag.name}
                    <span className="text-xs opacity-60">({tag._count.adTags})</span>
                    <button onClick={() => deleteTag(tag.id)} className="opacity-0 group-hover:opacity-100 ml-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
