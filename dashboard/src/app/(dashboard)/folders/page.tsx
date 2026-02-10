"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import EmptyState from "@/components/ui/EmptyState";
import { FolderOpen, Plus, ChevronRight, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Folder {
  id: string;
  name: string;
  parentFolderId: string | null;
  isSmart: boolean;
  subFolders: Folder[];
  _count: { adFolders: number };
}

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);

  const fetchFolders = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/folders", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); setFolders(Array.isArray(data) ? data : data.folders || data.data || []); }
    setLoading(false);
  };

  useEffect(() => { fetchFolders(); }, []);

  const createFolder = async () => {
    if (!newName.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName, parentFolderId: parentId }),
    });
    if (res.ok) { setNewName(""); setShowCreate(false); fetchFolders(); }
  };

  const deleteFolder = async (id: string) => {
    const token = localStorage.getItem("token");
    await fetch(`/api/folders/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchFolders();
  };

  const rootFolders = folders.filter((f) => !f.parentFolderId);

  const renderFolder = (folder: Folder, depth: number = 0) => (
    <div key={folder.id}>
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--card-hover)] cursor-pointer group transition-colors"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <FolderOpen className="w-5 h-5 shrink-0" style={{ color: "var(--primary)" }} />
        <span className="flex-1 font-medium text-sm">{folder.name}</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--tag-bg)", color: "var(--muted)" }}>
          {folder._count.adFolders} ads
        </span>
        {folder.isSmart && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>Smart</span>
        )}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setParentId(folder.id); setShowCreate(true); }}
            className="p-1 rounded hover:bg-[var(--card-hover)]"
            title="Add subfolder"
          >
            <Plus className="w-4 h-4" style={{ color: "var(--muted)" }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
            className="p-1 rounded hover:bg-[var(--card-hover)]"
          >
            <Trash2 className="w-4 h-4" style={{ color: "var(--danger)" }} />
          </button>
        </div>
        {folder.subFolders.length > 0 && <ChevronRight className="w-4 h-4" style={{ color: "var(--muted)" }} />}
      </div>
      {folder.subFolders.map((sub) => renderFolder(sub, depth + 1))}
    </div>
  );

  return (
    <>
      <TopBar
        title="Folders"
        subtitle={`${folders.length} folders`}
        actions={
          <button onClick={() => { setParentId(null); setShowCreate(true); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm font-medium" style={{ background: "var(--primary)" }}>
            <Plus className="w-4 h-4" /> New Folder
          </button>
        }
      />
      <div className="p-6">
        {showCreate && (
          <div className="mb-4 p-4 rounded-xl border flex items-center gap-3" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Folder name..."
              className="flex-1 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--background)" }}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
            />
            {parentId && <span className="text-xs" style={{ color: "var(--muted)" }}>Subfolder of: {folders.find((f) => f.id === parentId)?.name}</span>}
            <button onClick={createFolder} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "var(--primary)" }}>Create</button>
            <button onClick={() => { setShowCreate(false); setParentId(null); }} className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--card-border)" }}>Cancel</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--card-hover)" }} />
            ))}
          </div>
        ) : rootFolders.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No folders yet" description="Create folders to organize your saved ads." action={{ label: "Create Folder", onClick: () => setShowCreate(true) }} />
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--card-border)" }}>
            {rootFolders.map((f) => renderFolder(f))}
          </div>
        )}
      </div>
    </>
  );
}
