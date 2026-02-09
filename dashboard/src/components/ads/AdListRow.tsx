'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { Ad } from '@/types'
import Badge from '@/components/ui/Badge'
import Dropdown, { type DropdownItem } from '@/components/ui/Dropdown'
import {
  Star,
  ImageOff,
  MoreHorizontal,
  Eye,
  Tags,
  Link as LinkIcon,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react'

interface AdListRowProps {
  ad: Ad
  onToggleStar: (id: string) => void
  onSelect: (id: string) => void
  isSelected: boolean
  onDelete?: (id: string) => void
  onEditTags?: (id: string) => void
}

const formatLabels: Record<string, string> = {
  image: 'Image',
  video: 'Video',
  carousel: 'Carousel',
  collection: 'Collection',
}

export default function AdListRow({
  ad,
  onToggleStar,
  onSelect,
  isSelected,
  onDelete,
  onEditTags,
}: AdListRowProps) {
  const visibleTags = ad.tags?.slice(0, 2) ?? []
  const extraTagCount = (ad.tags?.length ?? 0) - 2

  const actionItems: DropdownItem[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => {},
    },
    {
      label: 'Edit Tags',
      icon: <Tags className="h-4 w-4" />,
      onClick: () => onEditTags?.(ad.id),
    },
    {
      label: 'Copy URL',
      icon: <LinkIcon className="h-4 w-4" />,
      onClick: () => {
        if (ad.destinationUrl) {
          navigator.clipboard.writeText(ad.destinationUrl)
        }
      },
    },
    { label: '', onClick: () => {}, divider: true },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => onDelete?.(ad.id),
      danger: true,
    },
  ]

  return (
    <tr
      className={cn(
        'group border-b border-gray-100 transition-colors hover:bg-gray-50',
        isSelected && 'bg-indigo-50/50'
      )}
    >
      {/* Checkbox */}
      <td className="w-10 px-4 py-3">
        <button
          onClick={() => onSelect(ad.id)}
          className="text-gray-400 hover:text-gray-600"
          aria-label={isSelected ? 'Deselect' : 'Select'}
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-indigo-600" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      </td>

      {/* Thumbnail */}
      <td className="w-16 py-3 pr-3">
        <Link href={`/dashboard/ads/${ad.id}`}>
          <div className="h-10 w-14 overflow-hidden rounded-md bg-gray-100">
            {ad.creativeUrl ? (
              <img
                src={ad.creativeUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-300">
                <ImageOff className="h-4 w-4" />
              </div>
            )}
          </div>
        </Link>
      </td>

      {/* Advertiser */}
      <td className="py-3 pr-4">
        <Link
          href={`/dashboard/ads/${ad.id}`}
          className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors"
        >
          {ad.advertiserName}
        </Link>
      </td>

      {/* Headline */}
      <td className="py-3 pr-4 max-w-[200px]">
        <p className="text-sm text-gray-600 truncate">
          {ad.headline || '--'}
        </p>
      </td>

      {/* Format */}
      <td className="py-3 pr-4">
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {formatLabels[ad.format] || ad.format}
        </span>
      </td>

      {/* Status */}
      <td className="py-3 pr-4">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              ad.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
          <span className="text-xs text-gray-600 capitalize">{ad.status}</span>
        </span>
      </td>

      {/* Tags */}
      <td className="py-3 pr-4">
        <div className="flex items-center gap-1">
          {visibleTags.map((tag) => (
            <Badge key={tag.id} label={tag.name} color={tag.color} size="sm" />
          ))}
          {extraTagCount > 0 && (
            <span className="text-xs text-gray-400">+{extraTagCount}</span>
          )}
        </div>
      </td>

      {/* Date */}
      <td className="py-3 pr-4">
        <span className="text-xs text-gray-500">{formatDate(ad.savedAt)}</span>
      </td>

      {/* Star */}
      <td className="w-10 py-3 pr-2">
        <button
          onClick={() => onToggleStar(ad.id)}
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
      </td>

      {/* Actions */}
      <td className="w-10 py-3 pr-4">
        <Dropdown
          trigger={
            <button className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={actionItems}
          align="right"
        />
      </td>
    </tr>
  )
}
