'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatRelativeDate } from '@/lib/utils'
import type { Ad } from '@/types'
import {
  Star,
  ImageOff,
  ExternalLink,
  MessageSquare,
  FolderOpen,
  Play,
} from 'lucide-react'

interface AdCardProps {
  ad: Ad
  onToggleStar: (id: string) => void
}

function getDaysAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return '1D'
  return `${diff}D`
}

export default function AdCard({ ad, onToggleStar }: AdCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white break-inside-avoid mb-4 transition-all hover:shadow-md">
      {/* Header: Advertiser info */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
          {ad.advertiserName?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{ad.advertiserName}</p>
        </div>
        <span className="text-xs font-medium text-green-600">●{getDaysAgo(ad.savedAt)}</span>
        <div className="flex items-center gap-1">
          <a
            href={ad.adLibraryId ? `https://www.facebook.com/ads/library/?id=${ad.adLibraryId}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar(ad.id); }}
            className="p-1 transition-colors"
          >
            <Star className={cn('h-3.5 w-3.5', ad.starred ? 'fill-amber-400 text-amber-400' : 'text-gray-400 hover:text-amber-400')} />
          </button>
        </div>
      </div>

      {/* Creative */}
      <Link href={`/dashboard/ads/${ad.id}`} className="relative block overflow-hidden bg-gray-50">
        {ad.creativeUrl ? (
          <img
            src={ad.creativeUrl}
            alt={ad.headline || 'Ad creative'}
            className="w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center text-gray-300">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        {ad.format === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
              <Play className="h-5 w-5 fill-white" />
            </div>
          </div>
        )}
      </Link>

      {/* Footer */}
      <div className="px-3 py-2.5 space-y-2">
        {/* Notes count */}
        {(ad.notes?.length ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-gray-400">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="text-xs">{ad.notes?.length || 0}</span>
          </div>
        )}

        {/* Folders */}
        {ad.folders && ad.folders.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ad.folders.map((f: any) => {
              const folder = f.folder || f
              return (
                <span
                  key={folder.id}
                  className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  <FolderOpen className="h-3 w-3" />
                  {folder.name}
                </span>
              )
            })}
          </div>
        )}

        {/* Tags */}
        {ad.tags && ad.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ad.tags.slice(0, 3).map((t: any) => {
              const tag = t.tag || t
              return (
                <span
                  key={tag.id}
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: `${tag.color || '#6366f1'}15`, color: tag.color || '#6366f1' }}
                >
                  {tag.name}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
