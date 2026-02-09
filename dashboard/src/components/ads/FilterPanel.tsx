'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import { AD_FORMATS, PLATFORMS, AD_STATUSES, CTA_TYPES } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
  X,
  Star,
  ChevronDown,
  ChevronRight,
  Save,
  RotateCcw,
} from 'lucide-react'

export default function FilterPanel() {
  const {
    filters,
    updateFilter,
    clearFilters,
    filterPanelOpen,
    setFilterPanelOpen,
    folders,
    tags,
    savedFilters,
  } = useStore()

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    folders: true,
    tags: true,
    format: true,
    status: true,
    dateRange: false,
    cta: false,
    platforms: false,
    starred: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleArrayFilter = (key: 'folders' | 'tags' | 'formats' | 'statuses' | 'platforms' | 'ctaTypes', value: string) => {
    const current = filters[key] ?? []
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    updateFilter(key, updated)
  }

  if (!filterPanelOpen) return null

  const hasActiveFilters =
    (filters.folders?.length ?? 0) > 0 ||
    (filters.tags?.length ?? 0) > 0 ||
    (filters.formats?.length ?? 0) > 0 ||
    (filters.statuses?.length ?? 0) > 0 ||
    (filters.platforms?.length ?? 0) > 0 ||
    (filters.ctaTypes?.length ?? 0) > 0 ||
    filters.starred === true ||
    filters.dateRange !== undefined

  return (
    <div className="w-72 shrink-0 border-r border-gray-200 bg-gray-50/50 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        <div className="flex items-center gap-1">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Clear all
            </button>
          )}
          <button
            onClick={() => setFilterPanelOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Saved filters */}
      {savedFilters.length > 0 && (
        <div className="border-b border-gray-200 px-4 py-3">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Saved Filters
          </label>
          <select className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="">Select a saved filter...</option>
            {savedFilters.map((sf) => (
              <option key={sf.id} value={sf.id}>
                {sf.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {/* Folders */}
        <FilterSection
          title="Folders"
          expanded={expandedSections.folders}
          onToggle={() => toggleSection('folders')}
          count={filters.folders?.length}
        >
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {folders.map((folder) => (
              <label
                key={folder.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.folders?.includes(folder.id) ?? false}
                  onChange={() => toggleArrayFilter('folders', folder.id)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="truncate">{folder.name}</span>
                {folder._count && (
                  <span className="ml-auto text-xs text-gray-400">
                    {folder._count.ads}
                  </span>
                )}
              </label>
            ))}
            {folders.length === 0 && (
              <p className="px-2 py-1 text-xs text-gray-400">No folders yet</p>
            )}
          </div>
        </FilterSection>

        {/* Tags */}
        <FilterSection
          title="Tags"
          expanded={expandedSections.tags}
          onToggle={() => toggleSection('tags')}
          count={filters.tags?.length}
        >
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleArrayFilter('tags', tag.id)}
                className={cn(
                  'transition-all',
                  filters.tags?.includes(tag.id)
                    ? 'ring-2 ring-indigo-400 ring-offset-1 rounded-full'
                    : ''
                )}
              >
                <Badge label={tag.name} color={tag.color} size="sm" />
              </button>
            ))}
            {tags.length === 0 && (
              <p className="px-2 py-1 text-xs text-gray-400">No tags yet</p>
            )}
          </div>
          {(filters.tags?.length ?? 0) > 1 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Match:</span>
              <button
                onClick={() => updateFilter('tagLogic', 'OR')}
                className={cn(
                  'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                  filters.tagLogic === 'OR'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                Any
              </button>
              <button
                onClick={() => updateFilter('tagLogic', 'AND')}
                className={cn(
                  'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                  filters.tagLogic === 'AND'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                All
              </button>
            </div>
          )}
        </FilterSection>

        {/* Format */}
        <FilterSection
          title="Format"
          expanded={expandedSections.format}
          onToggle={() => toggleSection('format')}
          count={filters.formats?.length}
        >
          <div className="space-y-1">
            {AD_FORMATS.map((format) => (
              <label
                key={format}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.formats?.includes(format) ?? false}
                  onChange={() => toggleArrayFilter('formats', format)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="capitalize">{format}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Status */}
        <FilterSection
          title="Status"
          expanded={expandedSections.status}
          onToggle={() => toggleSection('status')}
          count={filters.statuses?.length}
        >
          <div className="space-y-1">
            {AD_STATUSES.map((status) => (
              <label
                key={status}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.statuses?.includes(status) ?? false}
                  onChange={() => toggleArrayFilter('statuses', status)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center gap-1.5 capitalize">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    )}
                  />
                  {status}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Date range */}
        <FilterSection
          title="Date Range"
          expanded={expandedSections.dateRange}
          onToggle={() => toggleSection('dateRange')}
        >
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={filters.dateRange?.start ?? ''}
                onChange={(e) =>
                  updateFilter('dateRange', {
                    start: e.target.value,
                    end: filters.dateRange?.end ?? '',
                  })
                }
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={filters.dateRange?.end ?? ''}
                onChange={(e) =>
                  updateFilter('dateRange', {
                    start: filters.dateRange?.start ?? '',
                    end: e.target.value,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </FilterSection>

        {/* CTA type */}
        <FilterSection
          title="CTA Type"
          expanded={expandedSections.cta}
          onToggle={() => toggleSection('cta')}
          count={filters.ctaTypes?.length}
        >
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {CTA_TYPES.map((cta) => (
              <label
                key={cta}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.ctaTypes?.includes(cta) ?? false}
                  onChange={() => toggleArrayFilter('ctaTypes', cta)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {cta}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Platforms */}
        <FilterSection
          title="Platforms"
          expanded={expandedSections.platforms}
          onToggle={() => toggleSection('platforms')}
          count={filters.platforms?.length}
        >
          <div className="space-y-1">
            {PLATFORMS.map((platform) => (
              <label
                key={platform}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.platforms?.includes(platform) ?? false}
                  onChange={() => toggleArrayFilter('platforms', platform)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {platform}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Starred */}
        <FilterSection
          title="Starred"
          expanded={expandedSections.starred}
          onToggle={() => toggleSection('starred')}
        >
          <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={filters.starred === true}
              onChange={() =>
                updateFilter('starred', filters.starred ? undefined : true)
              }
              className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Star className="h-4 w-4 text-amber-400" />
            Show only starred
          </label>
        </FilterSection>
      </div>

      {/* Footer */}
      {hasActiveFilters && (
        <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 p-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={clearFilters}
            className="w-full"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}

// Collapsible filter section
function FilterSection({
  title,
  expanded,
  onToggle,
  count,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="px-4 py-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <span className="flex items-center gap-2">
          {title}
          {count !== undefined && count > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-100 px-1.5 text-xs font-semibold text-indigo-700">
              {count}
            </span>
          )}
        </span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {expanded && <div className="mt-2">{children}</div>}
    </div>
  )
}
