"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Tags,
  Plus,
  Loader2,
  X,
  Trash2,
  Edit2,
  Palette,
  Hash,
} from "lucide-react";
import toast from "react-hot-toast";
import { useStore } from "@/store";
import type { TagType } from "@/types";

const TAG_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#6b7280",
  "#374151",
];

export default function TagsPage() {
  const token = useStore((s) => s.token);
  const tags = useStore((s) => s.tags);
  const setTags = useStore((s) => s.setTags);

  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#6366f1");
  const [tagGroup, setTagGroup] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTags = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/tags", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTags(data.data || data || []);
      }
    } catch {
      console.error("Failed to fetch tags");
    } finally {
      setLoading(false);
    }
  }, [token, setTags]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  async function handleSaveTag() {
    if (!token || !tagName.trim()) return;
    setSaving(true);
    try {
      const url = editingTag
        ? `/api/tags/${editingTag.id}`
        : "/api/tags";
      const method = editingTag ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tagName,
          color: tagColor,
          group: tagGroup || undefined,
        }),
      });
      if (res.ok) {
        toast.success(editingTag ? "Tag updated" : "Tag created");
        handleCloseModal();
        fetchTags();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save tag");
      }
    } catch {
      toast.error("Failed to save tag");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTag(tagId: string) {
    if (!token) return;
    if (!confirm("Delete this tag? It will be removed from all ads.")) return;
    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Tag deleted");
        fetchTags();
      }
    } catch {
      toast.error("Failed to delete tag");
    }
  }

  function handleOpenEdit(tag: TagType) {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setTagGroup(tag.group || "");
    setShowCreateModal(true);
  }

  function handleCloseModal() {
    setShowCreateModal(false);
    setEditingTag(null);
    setTagName("");
    setTagColor("#6366f1");
    setTagGroup("");
  }

  // Group tags by group field
  const tagGroups: Record<string, TagType[]> = {};
  const ungrouped: TagType[] = [];
  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  filteredTags.forEach((tag) => {
    if (tag.group) {
      if (!tagGroups[tag.group]) tagGroups[tag.group] = [];
      tagGroups[tag.group].push(tag);
    } else {
      ungrouped.push(tag);
    }
  });

  const allGroups = Object.keys(tagGroups).sort();

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
          <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
          <p className="mt-1 text-sm text-gray-500">
            {tags.length} tag{tags.length !== 1 ? "s" : ""} across{" "}
            {allGroups.length + (ungrouped.length > 0 ? 1 : 0)} group
            {allGroups.length + (ungrouped.length > 0 ? 1 : 0) !== 1
              ? "s"
              : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <Plus size={16} />
          New Tag
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Hash
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tags..."
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Tag Cloud */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Tag Cloud
        </h2>
        <div className="flex flex-wrap gap-2">
          {filteredTags
            .sort((a, b) => (b._count?.ads || 0) - (a._count?.ads || 0))
            .map((tag) => {
              const count = tag._count?.ads || 0;
              const size = count > 20 ? "text-lg" : count > 10 ? "text-base" : count > 5 ? "text-sm" : "text-xs";
              return (
                <span
                  key={tag.id}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium ${size} cursor-pointer transition-transform hover:scale-105`}
                  style={{
                    backgroundColor: `${tag.color}15`,
                    color: tag.color,
                    borderWidth: 1,
                    borderColor: `${tag.color}30`,
                  }}
                  onClick={() => handleOpenEdit(tag)}
                >
                  {tag.name}
                  {count > 0 && (
                    <span className="opacity-60">({count})</span>
                  )}
                </span>
              );
            })}
          {filteredTags.length === 0 && (
            <p className="text-sm text-gray-500">No tags found</p>
          )}
        </div>
      </div>

      {/* Tags by Group */}
      <div className="space-y-6">
        {allGroups.map((group) => (
          <div
            key={group}
            className="rounded-xl border border-gray-200 bg-white"
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                {group}
              </h2>
              <p className="text-xs text-gray-500">
                {tagGroups[group].length} tags
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {tagGroups[group].map((tag) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  onEdit={() => handleOpenEdit(tag)}
                  onDelete={() => handleDeleteTag(tag.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {ungrouped.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                Ungrouped
              </h2>
              <p className="text-xs text-gray-500">
                {ungrouped.length} tags
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {ungrouped.map((tag) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  onEdit={() => handleOpenEdit(tag)}
                  onDelete={() => handleDeleteTag(tag.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTag ? "Edit Tag" : "Create Tag"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="e.g., DTC, SaaS, Holiday"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setTagColor(c)}
                      className={`h-7 w-7 rounded-full transition-all ${
                        tagColor === c
                          ? "scale-110 ring-2 ring-offset-2"
                          : "hover:scale-105"
                      }`}
                      style={{
                        backgroundColor: c,
                        outlineColor: c,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Group (optional)
                </label>
                <input
                  type="text"
                  value={tagGroup}
                  onChange={(e) => setTagGroup(e.target.value)}
                  placeholder="e.g., Industry, Campaign Type"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              {/* Preview */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Preview
                </label>
                <span
                  className="inline-flex rounded-full px-3 py-1 text-sm font-medium"
                  style={{
                    backgroundColor: `${tagColor}15`,
                    color: tagColor,
                    border: `1px solid ${tagColor}30`,
                  }}
                >
                  {tagName || "Tag Name"}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTag}
                disabled={!tagName.trim() || saving}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingTag ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TagRow({
  tag,
  onEdit,
  onDelete,
}: {
  tag: TagType;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <span
          className="h-3.5 w-3.5 rounded-full"
          style={{ backgroundColor: tag.color }}
        />
        <span className="text-sm font-medium text-gray-900">{tag.name}</span>
        {tag.group && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
            {tag.group}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">
          {tag._count?.ads || 0} ads
        </span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
