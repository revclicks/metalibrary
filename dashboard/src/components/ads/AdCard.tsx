'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Ad } from '@/types'
import {
  Star,
  ImageOff,
  ExternalLink,
  Copy,
  MessageSquare,
  FolderOpen,
  Play,
  ChevronDown,
} from 'lucide-react'

interface AdCardProps {
  ad: Ad
  onToggleStar: (id: string) => void
  onSelect: (id: string) => void
  isSelected: boolean
}

function getDaysAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return ''
  if (diff === 1) return '1D'
  return `${diff}D`
}

const cardShadow = 'rgba(24,48,123,0.04) 0px 0px 0px 1px, rgba(26,48,84,0.04) 0px 1px 1px -0.5px, rgba(26,48,84,0.03) 0px 2px 2px -1px, rgba(26,48,84,0.03) 0px 3px 3px -1.5px, rgba(26,48,84,0.02) 0px 5px 5px -2.5px, rgba(26,48,84,0.02) 0px 8px 8px -4px'
const cardShadowHover = 'rgba(24,48,123,0.06) 0px 0px 0px 1px, rgba(26,48,84,0.06) 0px 2px 4px -1px, rgba(26,48,84,0.04) 0px 4px 8px -2px, rgba(26,48,84,0.04) 0px 8px 16px -4px'

export default function AdCard({ ad, onToggleStar, onSelect, isSelected }: AdCardProps) {
  const daysAgo = getDaysAgo(ad.savedAt)

  return (
    <div
      className="group inline-block w-full rounded-lg bg-white mb-4 break-inside-avoid transition-shadow duration-200 cursor-pointer"
      style={{ boxShadow: cardShadow }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = cardShadowHover)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = cardShadow)}
    >
      {/* Header: Advertiser row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-xs font-semibold text-white">
          {ad.advertiserName?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
            {ad.advertiserName}
          </p>
        </div>
        {daysAgo && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {daysAgo}
          </span>
        )}
        <div className="flex items-center gap-0.5">
          {ad.adLibraryId && (
            <a
              href={`https://www.facebook.com/ads/library/?id=${ad.adLibraryId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Creative */}
      <Link href={`/dashboard/ads/${ad.id}`} className="relative block overflow-hidden">
        {ad.creativeUrl ? (
          <img
            src={ad.creativeUrl}
            alt={ad.headline || 'Ad creative'}
            className="w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-50 text-gray-300">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        {ad.format === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
              <Play className="h-5 w-5 fill-white ml-0.5" />
            </div>
          </div>
        )}
      </Link>

      {/* Comment count row */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100">
        <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs text-gray-500">{ad._count?.notes || 0}</span>
      </div>

      {/* Board/Folder chip row */}
      <div className="px-3 py-2">
        {ad.folders && ad.folders.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {ad.folders.map((f: any) => {
              const folder = f.folder || f
              return (
                <button
                  key={folder.id}
                  className="inline-flex items-center gap-1.5 rounded bg-gray-50 border border-gray-100 pl-2 pr-1 py-1 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <FolderOpen className="h-3 w-3 text-gray-400" />
                  <span>{folder.name}</span>
                  <span className="text-gray-300 hover:text-gray-500 ml-0.5">×</span>
                </button>
              )
            })}
            <button className="inline-flex items-center gap-1 rounded text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1">
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button className="inline-flex items-center gap-1.5 rounded border border-dashed border-gray-200 px-2.5 py-1.5 text-xs text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors">
            <FolderOpen className="h-3 w-3" />
            Save to Folder
            <ChevronDown className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}
