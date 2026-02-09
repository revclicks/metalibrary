'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Ad } from '@/types'
import AdListRow from './AdListRow'
import EmptyState from '@/components/ui/EmptyState'
import { Bookmark, ChevronUp, ChevronDown } from 'lucide-react'

interface AdListProps {
  ads: Ad[]
  loading?: boolean
  onToggleStar: (id: string) => void
  onSelect: (id: string) => void
  selectedAds: string[]
  onSelectAll?: () => void
  onDelete?: (id: string) => void
  onEditTags?: (id: string) => void
}

type SortField = 'advertiserName' | 'headline' | 'format' | 'status' | 'savedAt'
type SortOrder = 'asc' | 'desc'

const columns: { key: SortField | null; label: string; sortable: boolean }[] = [
  { key: null, label: '', sortable: false }, // checkbox
  { key: null, label: '', sortable: false }, // thumbnail
  { key: 'advertiserName', label: 'Advertiser', sortable: true },
  { key: 'headline', label: 'Headline', sortable: true },
  { key: 'format', label: 'Format', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: null, label: 'Tags', sortable: false },
  { key: 'savedAt', label: 'Date Saved', sortable: true },
  { key: null, label: '', sortable: false }, // star
  { key: null, label: '', sortable: false }, // actions
]

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-3"><div className="h-4 w-4 animate-pulse rounded bg-gray-200" /></td>
      <td className="py-3 pr-3"><div className="h-10 w-14 animate-pulse rounded-md bg-gray-200" /></td>
      <td className="py-3 pr-4"><div className="h-4 w-28 animate-pulse rounded bg-gray-200" /></td>
      <td className="py-3 pr-4"><div className="h-4 w-40 animate-pulse rounded bg-gray-200" /></td>
      <td className="py-3 pr-4"><div className="h-5 w-14 animate-pulse rounded bg-gray-200" /></td>
      <td className="py-3 pr-4"><div className="h-4 w-16 animate-pulse rounded bg-gray-200" /></td>
      <td className="py-3 pr-4"><div className="h-5 w-20 animate-pulse rounded bg-gray-200" /></td>
      <td className="py-3 pr-4"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
      <td className="py-3 pr-2"><div className="h-4 w-4 animate-pulse rounded bg-gray-200" /></td>
      <td className="py-3 pr-4"><div className="h-4 w-4 animate-pulse rounded bg-gray-200" /></td>
    </tr>
  )
}

export default function AdList({
  ads,
  loading = false,
  onToggleStar,
  onSelect,
  selectedAds,
  onSelectAll,
  onDelete,
  onEditTags,
}: AdListProps) {
  const [sortField, setSortField] = useState<SortField>('savedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedAds = [...ads].sort((a, b) => {
    const aVal = a[sortField] ?? ''
    const bVal = b[sortField] ?? ''
    const cmp = String(aVal).localeCompare(String(bVal))
    return sortOrder === 'asc' ? cmp : -cmp
  })

  if (!loading && ads.length === 0) {
    return (
      <EmptyState
        icon={<Bookmark className="h-8 w-8" />}
        title="No ads found"
        description="Save ads from the Meta Ads Library using the browser extension, or adjust your filters."
      />
    )
  }

  const allSelected = ads.length > 0 && selectedAds.length === ads.length

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            {columns.map((col, i) => (
              <th
                key={i}
                className={cn(
                  'text-left text-xs font-medium uppercase tracking-wider text-gray-500',
                  i === 0 ? 'w-10 px-4 py-3' : 'py-3 pr-4'
                )}
              >
                {i === 0 ? (
                  <button
                    onClick={onSelectAll}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={allSelected ? 'Deselect all' : 'Select all'}
                  >
                    {allSelected ? '☑' : '☐'}
                  </button>
                ) : col.sortable && col.key ? (
                  <button
                    onClick={() => handleSort(col.key as SortField)}
                    className="group inline-flex items-center gap-1 hover:text-gray-700"
                  >
                    {col.label}
                    {sortField === col.key ? (
                      sortOrder === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    ) : (
                      <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : sortedAds.map((ad) => (
                <AdListRow
                  key={ad.id}
                  ad={ad}
                  onToggleStar={onToggleStar}
                  onSelect={onSelect}
                  isSelected={selectedAds.includes(ad.id)}
                  onDelete={onDelete}
                  onEditTags={onEditTags}
                />
              ))}
        </tbody>
      </table>
    </div>
  )
}
