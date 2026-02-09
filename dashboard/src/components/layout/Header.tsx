'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Tags,
  FolderInput,
  Trash2,
  Download,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import Dropdown, { type DropdownItem } from '@/components/ui/Dropdown'

export default function Header() {
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    selectedAds,
    clearSelection,
    filterPanelOpen,
    setFilterPanelOpen,
    filters,
    user,
  } = useStore()

  const hasActiveFilters =
    (filters.folders?.length ?? 0) > 0 ||
    (filters.tags?.length ?? 0) > 0 ||
    (filters.formats?.length ?? 0) > 0 ||
    (filters.statuses?.length ?? 0) > 0 ||
    (filters.platforms?.length ?? 0) > 0 ||
    filters.starred === true

  const activeFilterCount = [
    filters.folders,
    filters.tags,
    filters.formats,
    filters.statuses,
    filters.platforms,
  ].reduce((acc, arr) => acc + (arr?.length ?? 0), 0) + (filters.starred ? 1 : 0)

  const hasSelection = selectedAds.length > 0

  const userMenuItems: DropdownItem[] = [
    {
      label: user?.name || 'User',
      icon: <User className="h-4 w-4" />,
      onClick: () => {},
      disabled: true,
    },
    { label: '', onClick: () => {}, divider: true },
    {
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => {},
    },
    { label: '', onClick: () => {}, divider: true },
    {
      label: 'Log Out',
      icon: <LogOut className="h-4 w-4" />,
      onClick: () => {},
      danger: true,
    },
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      {/* Main header row */}
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search ads, advertisers, headlines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center rounded-lg border border-gray-300 p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'grid'
                ? 'bg-gray-900 text-white'
                : 'text-gray-400 hover:text-gray-600'
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'list'
                ? 'bg-gray-900 text-white'
                : 'text-gray-400 hover:text-gray-600'
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Filter button */}
        <button
          onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
            filterPanelOpen || hasActiveFilters
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <Dropdown
          trigger={
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  (user?.name?.charAt(0) || 'U').toUpperCase()
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          }
          items={userMenuItems}
          align="right"
        />
      </div>

      {/* Bulk action bar */}
      {hasSelection && (
        <div className="flex items-center gap-3 border-t border-indigo-100 bg-indigo-50 px-6 py-2.5">
          <span className="text-sm font-medium text-indigo-700">
            {selectedAds.length} ad{selectedAds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-1 ml-4">
            <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
              <Tags className="h-4 w-4" />
              Tag
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
              <FolderInput className="h-4 w-4" />
              Move to Folder
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
          <button
            onClick={clearSelection}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
      )}
    </header>
  )
}
