'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface BadgeProps {
  label: string
  color?: string
  removable?: boolean
  onRemove?: () => void
  className?: string
  size?: 'sm' | 'md'
}

export default function Badge({
  label,
  color,
  removable = false,
  onRemove,
  className,
  size = 'md',
}: BadgeProps) {
  // Determine if color is a hex code or tailwind class
  const isHex = color?.startsWith('#')

  const sizeStyles = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
        sizeStyles,
        !color && 'bg-gray-100 text-gray-700',
        color && !isHex && color,
        className
      )}
      style={
        isHex
          ? {
              backgroundColor: `${color}20`,
              color: color,
              borderColor: `${color}40`,
              borderWidth: '1px',
            }
          : undefined
      }
    >
      {isHex && (
        <span
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="truncate max-w-[120px]">{label}</span>
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="shrink-0 ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
          aria-label={`Remove ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
