'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { Ad, NoteType as Note, TagType as Tag, FolderType as Folder } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
  Star,
  ImageOff,
  Copy,
  Download,
  ExternalLink,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Play,
  Plus,
  X,
  FolderOpen,
  Tags,
  StickyNote,
  Info,
  Globe,
  Calendar,
  MonitorSmartphone,
  Hash,
  Link as LinkIcon,
  MousePointerClick,
} from 'lucide-react'

interface AdDetailViewProps {
  ad: Ad
  allTags?: Tag[]
  allFolders?: Folder[]
  onToggleStar?: (id: string) => void
  onDelete?: (id: string) => void
  onAddTag?: (adId: string, tagId: string) => void
  onRemoveTag?: (adId: string, tagId: string) => void
  onAddFolder?: (adId: string, folderId: string) => void
  onRemoveFolder?: (adId: string, folderId: string) => void
  onAddNote?: (adId: string, content: string) => void
}

export default function AdDetailView({
  ad,
  allTags = [],
  allFolders = [],
  onToggleStar,
  onDelete,
  onAddTag,
  onRemoveTag,
  onAddFolder,
  onRemoveFolder,
  onAddNote,
}: AdDetailViewProps) {
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [noteText, setNoteText] = useState('')
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [showFolderPicker, setShowFolderPicker] = useState(false)

  const adTags = ad.tags ?? []
  const adFolders = ad.folders ?? []
  const adNotes = ad.notes ?? []
  const carouselCards = ad.carouselCards ?? []

  const unassignedTags = allTags.filter(
    (t) => !adTags.some((at) => at.id === t.id)
  )
  const unassignedFolders = allFolders.filter(
    (f) => !adFolders.some((af) => af.id === f.id)
  )

  const handleCopyText = () => {
    const textParts = [ad.primaryText, ad.headline, ad.description].filter(Boolean)
    navigator.clipboard.writeText(textParts.join('\n\n'))
  }

  const handleSubmitNote = () => {
    if (noteText.trim()) {
      onAddNote?.(ad.id, noteText.trim())
      setNoteText('')
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Left: Creative Preview */}
        <div className="lg:col-span-3 space-y-6">
          {/* Creative */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
            {ad.format === 'video' && ad.videoUrl ? (
              <video
                src={ad.videoUrl}
                controls
                poster={ad.creativeUrl || undefined}
                className="w-full aspect-video object-contain bg-black"
              />
            ) : ad.format === 'carousel' && carouselCards.length > 0 ? (
              <div className="relative">
                <div className="aspect-square overflow-hidden">
                  {carouselCards[carouselIndex]?.imageUrl ? (
                    <img
                      src={carouselCards[carouselIndex].imageUrl!}
                      alt={carouselCards[carouselIndex].headline || `Card ${carouselIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <ImageOff className="h-16 w-16" />
                    </div>
                  )}
                </div>
                {/* Carousel controls */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/50 p-4">
                  <button
                    onClick={() =>
                      setCarouselIndex((i) =>
                        i === 0 ? carouselCards.length - 1 : i - 1
                      )
                    }
                    className="rounded-full bg-white/90 p-1.5 text-gray-700 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium text-white">
                    {carouselIndex + 1} / {carouselCards.length}
                  </span>
                  <button
                    onClick={() =>
                      setCarouselIndex((i) =>
                        i === carouselCards.length - 1 ? 0 : i + 1
                      )
                    }
                    className="rounded-full bg-white/90 p-1.5 text-gray-700 hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                {/* Carousel card info */}
                {carouselCards[carouselIndex]?.headline && (
                  <div className="border-t border-gray-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {carouselCards[carouselIndex].headline}
                    </p>
                    {carouselCards[carouselIndex].description && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {carouselCards[carouselIndex].description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : ad.creativeUrl ? (
              <img
                src={ad.creativeUrl}
                alt={ad.headline || 'Ad creative'}
                className="w-full object-contain"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center text-gray-300">
                <ImageOff className="h-16 w-16" />
              </div>
            )}
          </div>

          {/* Ad copy */}
          <div className="rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Ad Copy
            </h3>
            {ad.primaryText && (
              <div>
                <label className="text-xs font-medium text-gray-500">Primary Text</label>
                <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                  {ad.primaryText}
                </p>
              </div>
            )}
            {ad.headline && (
              <div>
                <label className="text-xs font-medium text-gray-500">Headline</label>
                <p className="mt-1 text-base font-semibold text-gray-900">{ad.headline}</p>
              </div>
            )}
            {ad.description && (
              <div>
                <label className="text-xs font-medium text-gray-500">Description</label>
                <p className="mt-1 text-sm text-gray-700">{ad.description}</p>
              </div>
            )}
            {ad.ctaType && ad.ctaType !== 'No Button' && (
              <div>
                <label className="text-xs font-medium text-gray-500">CTA Button</label>
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                    <MousePointerClick className="h-4 w-4" />
                    {ad.ctaType}
                  </span>
                </div>
              </div>
            )}
            {ad.destinationUrl && (
              <div>
                <label className="text-xs font-medium text-gray-500">Destination URL</label>
                <a
                  href={ad.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 break-all"
                >
                  <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                  {ad.displayUrl || ad.destinationUrl}
                </a>
              </div>
            )}
          </div>

          {/* Screenshot */}
          {ad.screenshotUrl && (
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Screenshot
              </h3>
              <img
                src={ad.screenshotUrl}
                alt="Ad screenshot"
                className="w-full rounded-lg border border-gray-100"
              />
            </div>
          )}
        </div>

        {/* Right: Meta & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Advertiser info */}
          <div className="rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                {ad.advertiserName}
              </h3>
              <button
                onClick={() => onToggleStar?.(ad.id)}
                aria-label={ad.starred ? 'Unstar' : 'Star'}
              >
                <Star
                  className={cn(
                    'h-5 w-5',
                    ad.starred
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300 hover:text-amber-400'
                  )}
                />
              </button>
            </div>
            {ad.pageId && (
              <a
                href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=${ad.pageId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View in Meta Ads Library
              </a>
            )}
          </div>

          {/* Meta data */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Details
            </h3>
            <dl className="space-y-3">
              <MetaRow icon={<Info className="h-4 w-4" />} label="Format">
                <span className="capitalize">{ad.format}</span>
              </MetaRow>
              <MetaRow icon={<div className={cn('h-2 w-2 rounded-full', ad.status === 'active' ? 'bg-green-500' : 'bg-gray-400')} />} label="Status">
                <span className="capitalize">{ad.status}</span>
              </MetaRow>
              <MetaRow icon={<MonitorSmartphone className="h-4 w-4" />} label="Platforms">
                {ad.platforms && ad.platforms.length > 0 ? (Array.isArray(ad.platforms) ? ad.platforms.join(', ') : ad.platforms) : '--'}
              </MetaRow>
              <MetaRow icon={<Globe className="h-4 w-4" />} label="Countries">
                {ad.countries && ad.countries.length > 0 ? (Array.isArray(ad.countries) ? ad.countries.join(', ') : ad.countries) : '--'}
              </MetaRow>
              <MetaRow icon={<Calendar className="h-4 w-4" />} label="Started">
                {ad.adStartDate ? formatDate(ad.adStartDate) : '--'}
              </MetaRow>
              {ad.adEndDate && (
                <MetaRow icon={<Calendar className="h-4 w-4" />} label="Ended">
                  {formatDate(ad.adEndDate)}
                </MetaRow>
              )}
              <MetaRow icon={<Calendar className="h-4 w-4" />} label="Saved">
                {formatDate(ad.savedAt)}
              </MetaRow>
              {ad.adLibraryId && (
                <MetaRow icon={<Hash className="h-4 w-4" />} label="Library ID">
                  <span className="font-mono text-xs">{ad.adLibraryId}</span>
                </MetaRow>
              )}
            </dl>
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Tags className="h-4 w-4" />
                Tags
              </h3>
              <button
                onClick={() => setShowTagPicker(!showTagPicker)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {adTags.map((tag) => (
                <Badge
                  key={tag.id}
                  label={tag.name}
                  color={tag.color}
                  removable
                  onRemove={() => onRemoveTag?.(ad.id, tag.id)}
                />
              ))}
              {adTags.length === 0 && !showTagPicker && (
                <p className="text-xs text-gray-400">No tags assigned</p>
              )}
            </div>
            {showTagPicker && unassignedTags.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500 mb-2">Add a tag:</p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {unassignedTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => onAddTag?.(ad.id, tag.id)}
                    >
                      <Badge label={tag.name} color={tag.color} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Folders */}
          <div className="rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4" />
                Folders
              </h3>
              <button
                onClick={() => setShowFolderPicker(!showFolderPicker)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {adFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <FolderOpen className="h-4 w-4 text-gray-400" />
                    {folder.name}
                  </span>
                  <button
                    onClick={() => onRemoveFolder?.(ad.id, folder.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {adFolders.length === 0 && !showFolderPicker && (
                <p className="text-xs text-gray-400">Not in any folder</p>
              )}
            </div>
            {showFolderPicker && unassignedFolders.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500 mb-2">Add to folder:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {unassignedFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => onAddFolder?.(ad.id, folder.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FolderOpen className="h-4 w-4 text-gray-400" />
                      {folder.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <StickyNote className="h-4 w-4" />
              Notes
            </h3>
            <div className="space-y-3">
              {adNotes.map((note) => (
                <div key={note.id} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>{note.user?.name || 'Unknown'}</span>
                    <span>&middot;</span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                </div>
              ))}
              {adNotes.length === 0 && (
                <p className="text-xs text-gray-400">No notes yet</p>
              )}
            </div>
            {/* Add note form */}
            <div className="mt-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmitNote}
                  disabled={!noteText.trim()}
                >
                  Add Note
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Copy className="h-4 w-4" />}
              onClick={handleCopyText}
            >
              Copy Text
            </Button>
            {(ad.creativeUrl || ad.videoUrl) && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Download className="h-4 w-4" />}
                onClick={() => {
                  const url = ad.videoUrl || ad.creativeUrl
                  if (url) window.open(url, '_blank')
                }}
              >
                Download
              </Button>
            )}
            {ad.destinationUrl && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ExternalLink className="h-4 w-4" />}
                onClick={() => window.open(ad.destinationUrl!, '_blank')}
              >
                Landing Page
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => onDelete?.(ad.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gray-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="text-sm text-gray-900">{children}</dd>
      </div>
    </div>
  )
}
