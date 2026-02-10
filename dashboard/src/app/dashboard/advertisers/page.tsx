'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Eye, ExternalLink, Loader2 } from 'lucide-react'

interface Advertiser {
  name: string
  pageId?: string | null
  adCount: number
  activeAds: number
  topFormat: string
  lastSeen: string
}

export default function AdvertisersPage() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAdvertisers() {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/advertisers', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setAdvertisers(data.data || data || [])
        }
      } catch (err) {
        console.error('Failed to fetch advertisers:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAdvertisers()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white min-h-full p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Advertisers</h1>
        <p className="text-sm text-gray-500">Brands from your saved ads</p>
      </div>

      {advertisers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <Building2 size={28} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">No advertisers yet</h2>
          <p className="mt-1 text-sm text-gray-500 max-w-sm">
            Save ads from the Meta Ads Library using the Chrome extension, and advertisers will appear here automatically.
          </p>
          <Link href="/dashboard" className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Go to Dashboard →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {advertisers.map((adv, i) => (
            <div
              key={adv.pageId || adv.name || i}
              className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                  {adv.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{adv.name}</h3>
                  {adv.lastSeen && (
                    <span className="text-xs text-gray-400">Last seen {adv.lastSeen}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-lg bg-gray-50 p-2 text-center">
                  <p className="text-lg font-bold text-gray-900">{adv.adCount}</p>
                  <p className="text-[10px] text-gray-500">Total</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2 text-center">
                  <p className="text-lg font-bold text-green-600">{adv.activeAds || 0}</p>
                  <p className="text-[10px] text-gray-500">Active</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2 text-center">
                  <p className="text-xs font-bold text-gray-900 capitalize">{adv.topFormat || '—'}</p>
                  <p className="text-[10px] text-gray-500">Top Format</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard?advertiser=${encodeURIComponent(adv.name)}`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Eye size={12} /> View Ads
                </Link>
                {adv.pageId && (
                  <a
                    href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=${adv.pageId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <ExternalLink size={12} /> Ad Library
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
