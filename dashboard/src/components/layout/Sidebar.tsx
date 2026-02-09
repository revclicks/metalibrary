'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import {
  Bookmark,
  FolderOpen,
  Tags,
  Users,
  BarChart3,
  GitCompareArrows,
  UsersRound,
  Settings,
  ChevronDown,
  ChevronRight,
  FolderClosed,
  LogOut,
  Menu,
  X,
  Layers,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Saved Ads', href: '/dashboard', icon: <Bookmark className="h-5 w-5" /> },
  { label: 'Folders', href: '/dashboard/folders', icon: <FolderOpen className="h-5 w-5" /> },
  { label: 'Tags', href: '/dashboard/tags', icon: <Tags className="h-5 w-5" /> },
  { label: 'Advertisers', href: '/dashboard/advertisers', icon: <Users className="h-5 w-5" /> },
  { label: 'Analytics', href: '/dashboard/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Compare', href: '/dashboard/compare', icon: <GitCompareArrows className="h-5 w-5" /> },
  { label: 'Team', href: '/dashboard/team', icon: <UsersRound className="h-5 w-5" /> },
  { label: 'Settings', href: '/dashboard/settings', icon: <Settings className="h-5 w-5" /> },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen, folders, setActiveFolderId, user, logout } = useStore()
  const [foldersExpanded, setFoldersExpanded] = useState(true)

  const topLevelFolders = folders.filter((f) => !f.parentFolderId)

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-gray-900 p-2 text-white lg:hidden"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gray-900 transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / App name */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Ad Library Saver</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      // Close on mobile
                      if (window.innerWidth < 1024) setSidebarOpen(false)
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Folder tree preview */}
          {topLevelFolders.length > 0 && (
            <div className="mt-6 border-t border-gray-800 pt-4">
              <button
                onClick={() => setFoldersExpanded(!foldersExpanded)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-400"
              >
                Folders
                {foldersExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {foldersExpanded && (
                <ul className="mt-1 space-y-0.5">
                  {topLevelFolders.slice(0, 8).map((folder) => (
                    <li key={folder.id}>
                      <button
                        onClick={() => setActiveFolderId(folder.id)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors"
                      >
                        <FolderClosed className="h-4 w-4 shrink-0" />
                        <span className="truncate">{folder.name}</span>
                        {folder._count && (
                          <span className="ml-auto text-xs text-gray-600">
                            {folder._count.ads}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                  {topLevelFolders.length > 8 && (
                    <li>
                      <Link
                        href="/dashboard/folders"
                        className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-300"
                      >
                        View all {topLevelFolders.length} folders
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-sm font-medium text-white">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || ''}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                (user?.name?.charAt(0) || 'U').toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || 'User'}
              </p>
              <p className="truncate text-xs text-gray-500">
                {user?.email || ''}
              </p>
            </div>
            <button
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              aria-label="Log out"
              onClick={() => { logout(); window.location.href = '/auth/login'; }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
