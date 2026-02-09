'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab?: string
  defaultTab?: string
  onChange?: (tabId: string) => void
  className?: string
}

export default function Tabs({
  tabs,
  activeTab: controlledActiveTab,
  defaultTab,
  onChange,
  className,
}: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.id || '')

  const activeTab = controlledActiveTab ?? internalTab

  const handleTabClick = (tabId: string) => {
    if (!controlledActiveTab) {
      setInternalTab(tabId)
    }
    onChange?.(tabId)
  }

  return (
    <div className={cn('border-b border-gray-200', className)}>
      <nav className="-mb-px flex gap-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'group relative flex items-center gap-2 whitespace-nowrap pb-3 pt-1 text-sm font-medium transition-colors',
                isActive
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.icon && (
                <span
                  className={cn(
                    'shrink-0',
                    isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                >
                  {tab.icon}
                </span>
              )}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'ml-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    isActive
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {tab.count}
                </span>
              )}
              {/* Active underline */}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
