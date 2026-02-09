'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import {
  Plus,
  Trash2,
  GripVertical,
  Check,
  X,
  Pencil,
  AlertTriangle,
  Palette,
} from 'lucide-react'

interface TagManagerProps {
  tags: Tag[]
  onCreateTag?: (name: string, color: string, group: string | null) => void
  onRenameTag?: (id: string, newName: string) => void
  onDeleteTag?: (id: string) => void
  onChangeColor?: (id: string, newColor: string) => void
  onReorder?: (tagIds: string[]) => void
}

const PRESET_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6b7280', // gray
  '#78716c', // stone
]

export default function TagManager({
  tags,
  onCreateTag,
  onRenameTag,
  onDeleteTag,
  onChangeColor,
  onReorder,
}: TagManagerProps) {
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [newTagGroup, setNewTagGroup] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [colorPickerId, setColorPickerId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  // Group tags by their group field
  const groupedTags = tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    const group = tag.group || 'Ungrouped'
    if (!acc[group]) acc[group] = []
    acc[group].push(tag)
    return acc
  }, {})

  const groups = Object.keys(groupedTags).sort((a, b) => {
    if (a === 'Ungrouped') return 1
    if (b === 'Ungrouped') return -1
    return a.localeCompare(b)
  })

  const handleCreateTag = () => {
    if (!newTagName.trim()) return
    onCreateTag?.(newTagName.trim(), newTagColor, newTagGroup.trim() || null)
    setNewTagName('')
    setNewTagColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)])
    setNewTagGroup('')
  }

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      onRenameTag?.(id, editingName.trim())
    }
    setEditingId(null)
    setEditingName('')
  }

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return
  }

  const handleDrop = (targetId: string, group: string) => {
    if (!draggedId || draggedId === targetId) return

    const groupTags = groupedTags[group] || []
    const currentOrder = groupTags.map((t) => t.id)
    const fromIndex = currentOrder.indexOf(draggedId)
    const toIndex = currentOrder.indexOf(targetId)

    if (fromIndex === -1 || toIndex === -1) return

    const newOrder = [...currentOrder]
    newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, draggedId)

    onReorder?.(newOrder)
    setDraggedId(null)
  }

  return (
    <div className="space-y-6">
      {/* Create new tag */}
      <div className="rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Create New Tag</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <Input
              label="Tag Name"
              placeholder="e.g., High Performing"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTag()
              }}
            />
          </div>
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Group</label>
            <input
              type="text"
              placeholder="Optional"
              value={newTagGroup}
              onChange={(e) => setNewTagGroup(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Color</label>
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.slice(0, 6).map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-all',
                    newTagColor === color
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <Button
            onClick={handleCreateTag}
            disabled={!newTagName.trim()}
            icon={<Plus className="h-4 w-4" />}
          >
            Add Tag
          </Button>
        </div>
        {/* Preview */}
        {newTagName.trim() && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Preview:</span>
            <Badge label={newTagName} color={newTagColor} />
          </div>
        )}
      </div>

      {/* Tag list by group */}
      {groups.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-400">
          No tags yet. Create one above.
        </div>
      )}

      {groups.map((group) => (
        <div key={group} className="rounded-xl border border-gray-200">
          <div className="border-b border-gray-100 px-5 py-3">
            <h4 className="text-sm font-semibold text-gray-700">{group}</h4>
          </div>
          <div className="divide-y divide-gray-50">
            {groupedTags[group].map((tag) => (
              <div
                key={tag.id}
                draggable
                onDragStart={() => handleDragStart(tag.id)}
                onDragOver={(e) => handleDragOver(e, tag.id)}
                onDrop={() => handleDrop(tag.id, group)}
                className={cn(
                  'flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50',
                  draggedId === tag.id && 'opacity-50'
                )}
              >
                {/* Drag handle */}
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-gray-300 hover:text-gray-500" />

                {/* Color swatch */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setColorPickerId(colorPickerId === tag.id ? null : tag.id)
                    }
                    className="h-6 w-6 rounded-full border border-gray-200 transition-transform hover:scale-110"
                    style={{ backgroundColor: tag.color }}
                  />
                  {colorPickerId === tag.id && (
                    <ColorPicker
                      currentColor={tag.color}
                      onSelect={(color) => {
                        onChangeColor?.(tag.id, color)
                        setColorPickerId(null)
                      }}
                      onClose={() => setColorPickerId(null)}
                    />
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  {editingId === tag.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(tag.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 rounded border border-indigo-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(tag.id)}
                        className="rounded p-1 text-green-600 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge label={tag.name} color={tag.color} />
                      {tag._count && (
                        <span className="text-xs text-gray-400">
                          {tag._count.ads} ad{tag._count.ads !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editingId !== tag.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(tag.id)
                        setEditingName(tag.name)
                      }}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      aria-label="Rename tag"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {deletingId === tag.id ? (
                      <div className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-xs text-red-600">Delete?</span>
                        <button
                          onClick={() => {
                            onDeleteTag?.(tag.id)
                            setDeletingId(null)
                          }}
                          className="rounded px-1.5 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(tag.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        aria-label="Delete tag"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ColorPicker({
  currentColor,
  onSelect,
  onClose,
}: {
  currentColor: string
  onSelect: (color: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-2 grid grid-cols-4 gap-1.5 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
    >
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className={cn(
            'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
            currentColor === color ? 'border-gray-900' : 'border-transparent'
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}
