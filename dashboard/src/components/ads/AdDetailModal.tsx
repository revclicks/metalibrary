'use client'

import { useState } from 'react'
import {
  X,
  Star,
  Copy,
  ExternalLink,
  Download,
  ChevronLeft,
  ChevronRight,
  Play,
  Tag,
  FolderOpen,
  MessageSquare,
  Calendar,
  Globe,
  Link2,
  Image as ImageIcon,
  Check,
} from 'lucide-react'

interface AdDetail {
  id: string
  adLibraryId: string | null
  advertiserName: string
  pageId: string | null
  format: string
  status: string
  primaryText: string | null
  headline: string | null
  description: string | null
  ctaType: string | null
  destinationUrl: string | null
  displayUrl: string | null
  creativeUrl: string | null
  videoUrl: string | null
  screenshotUrl: string | null
  platforms: string[]
  countries: string[]
  adStartDate: string | null
  adEndDate: string | null
  starred: boolean
  savedAt: string
  tags?: { id: string; name: string; color: string }[]
  folders?: { id: string; name: string }[]
  notes?: { id: string; content: string; createdAt: string; user?: { name: string | null } }[]
  carouselCards?: { id: string; position: number; imageUrl: string | null; headline: string | null; description: string | null; url: string | null }[]
}

interface AdDetailModalProps {
  ad: AdDetail
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

export function AdDetailModal({ ad, onClose, onPrev, onNext }: AdDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'annotations'>('details')
  const [newNote, setNewNote] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyText(text, field)}
      className="shrink-0 rounded p-1 transition-colors hover:opacity-70"
      style={{ color: 'var(--muted)' }}
      title="Copy to clipboard"
    >
      {copiedField === field ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Nav arrows */}
      {onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 z-50 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 z-50 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Modal */}
      <div
        className="relative z-50 flex h-[90vh] w-[90vw] max-w-6xl overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: 'var(--background)' }}
      >
        {/* Left: Creative Preview */}
        <div className="flex w-1/2 flex-col" style={{ background: 'var(--sidebar-bg)' }}>
          <div className="flex-1 flex items-center justify-center p-8">
            {ad.creativeUrl ? (
              ad.format === 'video' && ad.videoUrl ? (
                <video
                  src={ad.videoUrl}
                  controls
                  className="max-h-full max-w-full rounded-lg shadow-lg"
                  poster={ad.creativeUrl}
                />
              ) : (
                <img
                  src={ad.creativeUrl}
                  alt={ad.headline || 'Ad creative'}
                  className="max-h-full max-w-full rounded-lg shadow-lg object-contain"
                />
              )
            ) : (
              <div
                className="flex h-64 w-64 flex-col items-center justify-center rounded-xl"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }}
              >
                <ImageIcon size={64} strokeWidth={1} />
                <p className="mt-2 text-sm">No preview available</p>
              </div>
            )}
          </div>

          {/* Carousel cards */}
          {ad.format === 'carousel' && ad.carouselCards && ad.carouselCards.length > 0 && (
            <div
              className="flex gap-2 overflow-x-auto px-4 py-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              {ad.carouselCards.map((card) => (
                <div
                  key={card.id}
                  className="shrink-0 w-24 rounded-lg overflow-hidden"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <div className="aspect-square" style={{ background: 'var(--card)' }}>
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon size={20} style={{ color: 'var(--muted)' }} />
                      </div>
                    )}
                  </div>
                  {card.headline && (
                    <p className="px-1.5 py-1 text-xs truncate" style={{ color: 'var(--foreground)' }}>
                      {card.headline}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <button
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <Download size={14} />
              Download
            </button>
            {ad.destinationUrl && (
              <a
                href={ad.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                <ExternalLink size={14} />
                Landing Page
              </a>
            )}
            {ad.adLibraryId && (
              <a
                href={`https://www.facebook.com/ads/library/?id=${ad.adLibraryId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                <Globe size={14} />
                View in Ad Library
              </a>
            )}
          </div>
        </div>

        {/* Right: Details Panel */}
        <div className="flex w-1/2 flex-col" style={{ borderLeft: '1px solid var(--border)' }}>
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                {ad.advertiserName.charAt(0)}
              </div>
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {ad.advertiserName}
                </h2>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                  <span className={`inline-flex items-center gap-1 ${ad.status === 'active' ? 'text-green-500' : 'text-gray-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${ad.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
                    {ad.status}
                  </span>
                  <span>•</span>
                  <span>{ad.format}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-lg p-2 hover:opacity-70" style={{ color: 'var(--muted)' }}>
                <Star size={20} className={ad.starred ? 'text-yellow-500 fill-yellow-500' : ''} />
              </button>
              <button onClick={onClose} className="rounded-lg p-2 hover:opacity-70" style={{ color: 'var(--muted)' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-3" style={{ borderBottom: '1px solid var(--border)' }}>
            {(['details', 'notes', 'annotations'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 text-sm font-medium capitalize transition-colors"
                style={{
                  color: activeTab === tab ? 'var(--primary)' : 'var(--muted)',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {activeTab === 'details' && (
              <>
                {/* Ad Copy */}
                {ad.primaryText && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                        Primary Text
                      </label>
                      <CopyButton text={ad.primaryText} field="primaryText" />
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                      {ad.primaryText}
                    </p>
                  </div>
                )}

                {ad.headline && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                        Headline
                      </label>
                      <CopyButton text={ad.headline} field="headline" />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      {ad.headline}
                    </p>
                  </div>
                )}

                {ad.description && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                        Description
                      </label>
                      <CopyButton text={ad.description} field="description" />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                      {ad.description}
                    </p>
                  </div>
                )}

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-3">
                  {ad.ctaType && (
                    <div className="rounded-lg p-3" style={{ background: 'var(--sidebar-bg)' }}>
                      <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>CTA</label>
                      <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--foreground)' }}>{ad.ctaType}</p>
                    </div>
                  )}
                  {ad.adStartDate && (
                    <div className="rounded-lg p-3" style={{ background: 'var(--sidebar-bg)' }}>
                      <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Started</label>
                      <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--foreground)' }}>
                        {new Date(ad.adStartDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div className="rounded-lg p-3" style={{ background: 'var(--sidebar-bg)' }}>
                    <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Saved</label>
                    <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--foreground)' }}>
                      {new Date(ad.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {ad.platforms && ad.platforms.length > 0 && (
                    <div className="rounded-lg p-3" style={{ background: 'var(--sidebar-bg)' }}>
                      <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Platforms</label>
                      <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--foreground)' }}>
                        {ad.platforms.join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                {/* URLs */}
                {ad.destinationUrl && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      Destination URL
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={ad.destinationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm truncate hover:underline"
                        style={{ color: 'var(--primary)' }}
                      >
                        <Link2 size={12} />
                        {ad.destinationUrl}
                      </a>
                      <CopyButton text={ad.destinationUrl} field="url" />
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ad.tags?.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ background: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    <button
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ border: '1px dashed var(--border)', color: 'var(--muted)' }}
                    >
                      <Tag size={10} />
                      Add tag
                    </button>
                  </div>
                </div>

                {/* Folders */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Folders
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ad.folders?.map((folder) => (
                      <span
                        key={folder.id}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
                        style={{ background: 'var(--sidebar-bg)', color: 'var(--foreground)' }}
                      >
                        <FolderOpen size={10} />
                        {folder.name}
                      </span>
                    ))}
                    <button
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
                      style={{ border: '1px dashed var(--border)', color: 'var(--muted)' }}
                    >
                      <FolderOpen size={10} />
                      Add to folder
                    </button>
                  </div>
                </div>

                {/* Ad Library ID */}
                {ad.adLibraryId && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      Ad Library ID
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs" style={{ color: 'var(--foreground)' }}>{ad.adLibraryId}</code>
                      <CopyButton text={ad.adLibraryId} field="adLibraryId" />
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* New note input */}
                <div>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note... (markdown supported)"
                    className="w-full rounded-lg px-4 py-3 text-sm resize-none"
                    style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                      style={{ background: 'var(--primary)' }}
                    >
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Existing notes */}
                {ad.notes?.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg p-4"
                    style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                        {note.user?.name || 'You'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                      {note.content}
                    </p>
                  </div>
                ))}

                {(!ad.notes || ad.notes.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-8" style={{ color: 'var(--muted)' }}>
                    <MessageSquare size={32} strokeWidth={1} />
                    <p className="mt-2 text-sm">No notes yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'annotations' && (
              <div className="flex flex-col items-center justify-center py-8" style={{ color: 'var(--muted)' }}>
                <p className="text-sm">Click on the creative to add annotations</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
