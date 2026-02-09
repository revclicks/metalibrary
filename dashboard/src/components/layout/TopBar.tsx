'use client'

import { Bell, Plus, User } from 'lucide-react'

interface TopBarProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function TopBar({ title = 'Saved Ads', subtitle, actions }: TopBarProps) {
  return (
    <header
      className="flex h-14 items-center justify-between px-6"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}
    >
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h1>
          {subtitle && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <button
          className="relative rounded-lg p-2 transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          <Bell size={20} />
          <span
            className="absolute right-1 top-1 h-2 w-2 rounded-full"
            style={{ background: 'var(--danger)' }}
          />
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          <User size={16} />
        </button>
      </div>
    </header>
  )
}
