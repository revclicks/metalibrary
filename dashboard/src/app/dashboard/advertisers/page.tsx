'use client'

import { Building2, TrendingUp, Eye, Star, ExternalLink } from 'lucide-react'

const DEMO_ADVERTISERS = [
  { id: '1', name: 'Nike', adCount: 18, activeAds: 12, topFormat: 'Video', followed: true, lastSeen: '2 hours ago' },
  { id: '2', name: 'Apple', adCount: 15, activeAds: 11, topFormat: 'Image', followed: true, lastSeen: '1 day ago' },
  { id: '3', name: 'Shopify', adCount: 12, activeAds: 8, topFormat: 'Carousel', followed: false, lastSeen: '3 days ago' },
  { id: '4', name: 'Tesla', adCount: 10, activeAds: 4, topFormat: 'Video', followed: false, lastSeen: '1 week ago' },
  { id: '5', name: 'Airbnb', adCount: 8, activeAds: 6, topFormat: 'Image', followed: true, lastSeen: '5 hours ago' },
  { id: '6', name: 'HubSpot', adCount: 7, activeAds: 5, topFormat: 'Image', followed: false, lastSeen: '2 days ago' },
]

export default function AdvertisersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Advertisers</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Track and analyze advertisers from your saved ads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_ADVERTISERS.map((adv) => (
          <div
            key={adv.id}
            className="rounded-xl p-5 transition-colors cursor-pointer"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
                  style={{ background: 'var(--accent)', color: 'var(--primary)' }}
                >
                  {adv.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{adv.name}</h3>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>Last seen {adv.lastSeen}</span>
                </div>
              </div>
              <button>
                <Star
                  size={18}
                  className={adv.followed ? 'fill-yellow-500 text-yellow-500' : ''}
                  style={{ color: adv.followed ? undefined : 'var(--muted)' }}
                />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-lg p-2 text-center" style={{ background: 'var(--sidebar-bg)' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{adv.adCount}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Total</p>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: 'var(--sidebar-bg)' }}>
                <p className="text-lg font-bold text-green-500">{adv.activeAds}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Active</p>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: 'var(--sidebar-bg)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{adv.topFormat}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Top Format</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium"
                style={{ background: 'var(--sidebar-bg)', color: 'var(--foreground)' }}
              >
                <Eye size={12} /> View Ads
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium"
                style={{ background: 'var(--sidebar-bg)', color: 'var(--foreground)' }}
              >
                <ExternalLink size={12} /> Ad Library
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
