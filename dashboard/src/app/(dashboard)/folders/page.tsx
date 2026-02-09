"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  Video,
  Layers,
  Loader2,
  Search,
  MoreHorizontal,
  Trash2,
  Edit2,
  Share2,
  Zap,
  X,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useStore } from "@/store";
import type { FolderType, AdWithRelations } from "@/types";
import { formatDate } from "@/lib/utils";

export default function FoldersPage() {
  const token = useStore((s) => s.token);
  const folders = useStore((s) => s.folders);
  const setFolders = useStore((s) => s.setFolders);

  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [folderAds, setFolderAds] = useState<AdWithRelations[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParent, setNewFolderParent] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const fetchFolders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/folders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFolders(data.data || data || []);
      }
    } catch {
      console.error("Failed to fetch folders");
    } finally {
      setLoading(false);
    }
  }, [token, setFolders]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    if (!selectedFolder || !token) return;
    setLoadingAds(true);
    fetch(`/api/ads?folderId=${selectedFolder.id}&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setFolderAds(data.data || []))
      .catch(() => setFolderAds([]))
      .finally(() => setLoadingAds(false));
  }, [selectedFolder, token]);

  async function handleCreateFolder() {
    if (!token || !newFolderName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newFolderName,
          parentFolderId: newFolderParent || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Folder created");
        setShowCreateModal(false);
        setNewFolderName("");
        setNewFolderParent("");
        fetchFolders();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create folder");
      }
    } catch {
      toast.error("Failed to create folder");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteFolder(folderId: string) {
    if (!token) return;
    if (!confirm("Delete this folder? Ads inside will not be deleted.")) return;
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Folder deleted");
        if (selectedFolder?.id === folderId) setSelectedFolder(null);
        fetchFolders();
      }
    } catch {
      toast.error("Failed to delete folder");
    }
  }

  // Build folder tree from flat list
  const rootFolders = folders.filter((f) => !f.parentFolderId);

  // Count stats
  const totalAds = folders.reduce(
    (sum, f) => sum + (f._count?.ads || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Folders</h1>
          <p className="mt-1 text-sm text-gray-500">
            {folders.length} folder{folders.length !== 1 ? "s" : ""} with{" "}
            {totalAds} total ads
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <FolderPlus size={16} />
          New Folder
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Folder Tree - Left */}
        <div className="rounded-xl border border-gray-200 bg-white lg:col-span-1">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Folder Tree
            </h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto p-3">
            {rootFolders.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No folders yet. Create one to get started.
              </p>
            ) : (
              <div className="space-y-1">
                {rootFolders.map((folder) => (
                  <FolderTreeItem
                    key={folder.id}
                    folder={folder}
                    allFolders={folders}
                    selectedId={selectedFolder?.id || null}
                    onSelect={(f) => setSelectedFolder(f)}
                    onDelete={handleDeleteFolder}
                    depth={0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Folder Content - Right */}
        <div className="lg:col-span-2">
          {selectedFolder ? (
            <div className="space-y-4">
              {/* Folder Info */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                      <FolderOpen size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedFolder.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {selectedFolder._count?.ads || 0} ads
                        {selectedFolder.isSmart && (
                          <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                            <Zap size={12} /> Smart folder
                          </span>
                        )}
                        {selectedFolder.isShared && (
                          <span className="ml-2 inline-flex items-center gap-1 text-blue-600">
                            <Share2 size={12} /> Shared
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/folders/${selectedFolder.id}`}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Open
                  </Link>
                </div>

                {/* Folder Stats */}
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {["image", "video", "carousel", "collection"].map(
                    (format) => {
                      const count = folderAds.filter(
                        (a) => a.format === format
                      ).length;
                      return (
                        <div
                          key={format}
                          className="rounded-lg bg-gray-50 p-3 text-center"
                        >
                          <p className="text-lg font-bold text-gray-900">
                            {count}
                          </p>
                          <p className="text-xs capitalize text-gray-500">
                            {format}
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Folder Ads Grid */}
              {loadingAds ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
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
              ) : folderAds.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
                  <ImageIcon
                    size={40}
                    className="mx-auto text-gray-300"
                  />
                  <p className="mt-3 text-sm text-gray-500">
                    No ads in this folder yet
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {folderAds.map((ad) => (
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
                            <ImageIcon
                              size={24}
                              className="text-gray-300"
                            />
                          </div>
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
                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(ad.savedAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-24">
              <FolderOpen size={48} className="text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Select a folder
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a folder from the tree to view its contents
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Create Folder
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Q1 2024 Campaigns"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Parent Folder (optional)
                </label>
                <select
                  value={newFolderParent}
                  onChange={(e) => setNewFolderParent(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">None (root folder)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || creating}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating && <Loader2 size={16} className="animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderTreeItem({
  folder,
  allFolders,
  selectedId,
  onSelect,
  onDelete,
  depth,
}: {
  folder: FolderType;
  allFolders: FolderType[];
  selectedId: string | null;
  onSelect: (f: FolderType) => void;
  onDelete: (id: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const children = allFolders.filter(
    (f) => f.parentFolderId === folder.id
  );
  const isSelected = selectedId === folder.id;

  return (
    <div>
      <div
        className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors cursor-pointer ${
          isSelected
            ? "bg-indigo-50 text-indigo-700"
            : "text-gray-700 hover:bg-gray-50"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {children.length > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="shrink-0 text-gray-400"
          >
            {expanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <button
          onClick={() => onSelect(folder)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <FolderOpen
            size={16}
            className={isSelected ? "text-indigo-600" : "text-gray-400"}
          />
          <span className="truncate font-medium">{folder.name}</span>
          {folder.isSmart && <Zap size={12} className="text-amber-500" />}
        </button>
        <span className="shrink-0 text-xs text-gray-400">
          {folder._count?.ads || 0}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(folder.id);
          }}
          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-gray-400 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {expanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
