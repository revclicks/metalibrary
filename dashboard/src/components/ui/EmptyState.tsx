'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import Button from './Button'

interface EmptyStateProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ReactNode | React.ComponentType<any>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  let iconElement: React.ReactNode = null
  if (icon) {
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon && 'render' in icon)) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>
      iconElement = <IconComponent className="w-8 h-8" />
    } else {
      iconElement = icon as React.ReactNode
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      {iconElement && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          {iconElement}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button
            variant="primary"
            onClick={action.onClick}
            icon={action.icon}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
