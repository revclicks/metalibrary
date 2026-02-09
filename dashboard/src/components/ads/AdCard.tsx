'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatRelativeDate } from '@/lib/utils'
import type { Ad } from '@/types'
import Badge from '@/components/ui/Badge'
import {
  Star,
  ImageOff,
  CheckSquare,
  Square,
} from 'lucide-react'

interface AdCardProps {
  ad: Ad
  onToggleStar: (id: string) => void
  onSelect: (id: string) => void
  isSelected: boolean
}

const formatLabels: Record<string, string> = {
  image: 'Image',
  video: 'Video',
  carousel: 'Carousel',
  collection: 'Collection',
}

export default function AdCard({
  ad,
  onToggleStar,
  onSelect,
  isSelected,
}: AdCardProps) {
  const visibleTags = ad.tags?.slice(0, 3) ?? []
  const extraTagCount = (ad.tags?.length ?? 0) - 3

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-white transition-all hover:shadow-lg',
        isSelected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200'
      )}
    >
      {/* Thumbnail */}
      <Link href={`/dashboard/ads/${ad.id}`} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
        {ad.creativeUrl ? (
          <img
            src={ad.creativeUrl}
            alt={ad.headline || 'Ad creative'}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <ImageOff className="h-12 w-12" />
          </div>
        )}

        {/* Format badge (top-right) */}
        <span className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          {formatLabels[ad.format] || ad.format}
        </span>

        {/* Checkbox (top-left, shown on hover or when selected) */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSelect(ad.id)
          }}
          className={cn(
            'absolute left-2 top-2 rounded-md transition-opacity',
            isSelected
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          )}
          aria-label={isSelected ? 'Deselect ad' : 'Select ad'}
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-indigo-600 drop-shadow-md" />
          ) : (
            <Square className="h-5 w-5 text-white drop-shadow-md" />
          )}
        </button>

        {/* Status indicator */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-sm">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              ad.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
            )}
          />
          <span className="text-xs text-white capitalize">{ad.status}</span>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Advertiser + Star */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {ad.advertiserName}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleStar(ad.id)
            }}
            className="shrink-0 p-0.5 transition-colors"
            aria-label={ad.starred ? 'Unstar' : 'Star'}
          >
            <Star
              className={cn(
                'h-4 w-4',
                ad.starred
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300 hover:text-amber-400'
              )}
            />
          </button>
        </div>

        {/* Headline */}
        {ad.headline && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {ad.headline}
          </p>
        )}

        {/* Tags */}
        {visibleTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <Badge
                key={tag.id}
                label={tag.name}
                color={tag.color}
                size="sm"
              />
            ))}
            {extraTagCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                +{extraTagCount} more
              </span>
            )}
          </div>
        )}

        {/* Date */}
        <p className="mt-auto pt-3 text-xs text-gray-400">
          Saved {formatRelativeDate(ad.savedAt)}
        </p>
      </div>
    </div>
  )
}
