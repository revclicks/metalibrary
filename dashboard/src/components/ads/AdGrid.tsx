'use client'

import React from 'react'
import type { Ad } from '@/types'
import AdCard from './AdCard'
import EmptyState from '@/components/ui/EmptyState'
import { Bookmark, Plus } from 'lucide-react'

interface AdGridProps {
  ads: Ad[]
  loading?: boolean
  onToggleStar: (id: string) => void
  onSelect: (id: string) => void
  selectedAds: string[]
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="aspect-[4/3] animate-pulse bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-14 animate-pulse rounded-full bg-gray-200" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
        </div>
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200 pt-2" />
      </div>
    </div>
  )
}

export default function AdGrid({
  ads,
  loading = false,
  onToggleStar,
  onSelect,
  selectedAds,
}: AdGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (ads.length === 0) {
    return (
      <EmptyState
        icon={<Bookmark className="h-8 w-8" />}
        title="No ads found"
        description="Save ads from the Meta Ads Library using the browser extension, or adjust your filters."
        action={{
          label: 'Clear Filters',
          onClick: () => {},
          icon: <Plus className="h-4 w-4" />,
        }}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-6">
      {ads.map((ad) => (
        <AdCard
          key={ad.id}
          ad={ad}
          onToggleStar={onToggleStar}
          onSelect={onSelect}
          isSelected={selectedAds.includes(ad.id)}
        />
      ))}
    </div>
  )
}
