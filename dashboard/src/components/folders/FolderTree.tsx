'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Folder } from '@/types'
import {
  ChevronRight,
  ChevronDown,
  FolderClosed,
  FolderOpen,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Share2,
} from 'lucide-react'

interface FolderTreeProps {
  folders: Folder[]
  activeFolderId: string | null
  onSelectFolder: (id: string | null) => void
  onCreateFolder?: () => void
  onRenameFolder?: (id: string, newName: string) => void
  onDeleteFolder?: (id: string) => void
  onShareFolder?: (id: string) => void
}

export default function FolderTree({
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onShareFolder,
}: FolderTreeProps) {
  const topLevelFolders = folders.filter((f) => !f.parentFolderId)

  // Build a lookup for child folders
  const childrenMap = new Map<string, Folder[]>()
  folders.forEach((f) => {
    if (f.parentFolderId) {
      const children = childrenMap.get(f.parentFolderId) || []
      children.push(f)
      childrenMap.set(f.parentFolderId, children)
    }
  })

  return (
    <div className="space-y-1">
      {/* All Ads option */}
      <button
        onClick={() => onSelectFolder(null)}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          activeFolderId === null
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <FolderOpen className="h-4 w-4" />
        All Ads
      </button>

      {/* Folder items */}
      {topLevelFolders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          childrenMap={childrenMap}
          depth={0}
          activeFolderId={activeFolderId}
          onSelectFolder={onSelectFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onShareFolder={onShareFolder}
        />
      ))}

      {/* Create folder button */}
      {onCreateFolder && (
        <button
          onClick={onCreateFolder}
          className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Folder
        </button>
      )}
    </div>
  )
}

interface FolderNodeProps {
  folder: Folder
  childrenMap: Map<string, Folder[]>
  depth: number
  activeFolderId: string | null
  onSelectFolder: (id: string | null) => void
  onRenameFolder?: (id: string, newName: string) => void
  onDeleteFolder?: (id: string) => void
  onShareFolder?: (id: string) => void
}

function FolderNode({
  folder,
  childrenMap,
  depth,
  activeFolderId,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder,
  onShareFolder,
}: FolderNodeProps) {
  const [expanded, setExpanded] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(folder.name)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const children = childrenMap.get(folder.id) || []
  const hasChildren = children.length > 0
  const isActive = activeFolderId === folder.id
  const adCount = folder._count?.ads ?? 0

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [contextMenu])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== folder.name) {
      onRenameFolder?.(folder.id, renameValue.trim())
    }
    setIsRenaming(false)
  }

  return (
    <div>
      <div
        className={cn(
          'group flex items-center rounded-lg transition-colors',
          isActive ? 'bg-indigo-50' : 'hover:bg-gray-100'
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600',
            !hasChildren && 'invisible'
          )}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Folder button */}
        <button
          onClick={() => onSelectFolder(folder.id)}
          className={cn(
            'flex flex-1 items-center gap-2 py-2 pr-2 text-sm min-w-0',
            isActive ? 'text-indigo-700 font-medium' : 'text-gray-700'
          )}
        >
          {expanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-indigo-500" />
          ) : (
            <FolderClosed className="h-4 w-4 shrink-0 text-gray-400" />
          )}
          {isRenaming ? (
            <input
              ref={inputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit()
                if (e.key === 'Escape') {
                  setRenameValue(folder.name)
                  setIsRenaming(false)
                }
              }}
              className="flex-1 rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{folder.name}</span>
          )}
          {adCount > 0 && !isRenaming && (
            <span className="ml-auto shrink-0 text-xs text-gray-400">{adCount}</span>
          )}
        </button>

        {/* More actions */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            const rect = (e.target as HTMLElement).getBoundingClientRect()
            setContextMenu({ x: rect.right, y: rect.bottom })
          }}
          className="shrink-0 rounded p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-600 transition-all mr-1"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              setIsRenaming(true)
              setContextMenu(null)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4" />
            Rename
          </button>
          <button
            onClick={() => {
              onShareFolder?.(folder.id)
              setContextMenu(null)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => {
              onDeleteFolder?.(folder.id)
              setContextMenu(null)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}

      {/* Children */}
      {expanded &&
        children.map((child) => (
          <FolderNode
            key={child.id}
            folder={child}
            childrenMap={childrenMap}
            depth={depth + 1}
            activeFolderId={activeFolderId}
            onSelectFolder={onSelectFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onShareFolder={onShareFolder}
          />
        ))}
    </div>
  )
}
