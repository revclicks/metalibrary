'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Ad, TagType as Tag } from '@/types'
import {
  Bookmark,
  Zap,
  Users,
  LayoutGrid,
  TrendingUp,
} from 'lucide-react'

interface AnalyticsDashboardProps {
  ads: Ad[]
  tags?: Tag[]
}

// ---- Summary Card ----
function SummaryCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            color
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </div>
  )
}

// ---- SVG Line Chart ----
function LineChart({
  data,
  title,
}: {
  data: { label: string; value: number }[]
  title: string
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const width = 600
  const height = 200
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - (d.value / maxValue) * chartHeight,
    ...d,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const areaD =
    pathD +
    ` L ${points[points.length - 1].x} ${padding.top + chartHeight}` +
    ` L ${points[0].x} ${padding.top + chartHeight} Z`

  // Y-axis gridlines
  const gridLines = 4
  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) => ({
    value: Math.round((maxValue / gridLines) * i),
    y: padding.top + chartHeight - (i / gridLines) * chartHeight,
  }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              stroke="#f3f4f6"
              strokeWidth={1}
            />
            <text
              x={padding.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-gray-400"
              fontSize={10}
            >
              {tick.value}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#lineGradient)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="white" stroke="#6366f1" strokeWidth={2} />
        ))}

        {/* X-axis labels */}
        {points.map((p, i) => {
          // Show limited labels to avoid clutter
          if (data.length > 10 && i % Math.ceil(data.length / 8) !== 0 && i !== data.length - 1) return null
          return (
            <text
              key={i}
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize={9}
            >
              {p.label}
            </text>
          )
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

// ---- SVG Pie Chart ----
function PieChart({
  data,
  title,
}: {
  data: { label: string; value: number; color: string }[]
  title: string
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  const size = 180
  const center = size / 2
  const radius = 70
  const innerRadius = 40

  let currentAngle = -Math.PI / 2
  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const x1 = center + radius * Math.cos(startAngle)
    const y1 = center + radius * Math.sin(startAngle)
    const x2 = center + radius * Math.cos(endAngle)
    const y2 = center + radius * Math.sin(endAngle)

    const ix1 = center + innerRadius * Math.cos(startAngle)
    const iy1 = center + innerRadius * Math.sin(startAngle)
    const ix2 = center + innerRadius * Math.cos(endAngle)
    const iy2 = center + innerRadius * Math.sin(endAngle)

    const largeArc = angle > Math.PI ? 1 : 0

    const path = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ')

    return { ...d, path, percentage: ((d.value / total) * 100).toFixed(0) }
  })

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="flex items-center gap-6">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-44 w-44 shrink-0"
        >
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.path}
              fill={slice.color}
              stroke="white"
              strokeWidth={2}
              className="transition-opacity hover:opacity-80"
            />
          ))}
          {/* Center text */}
          <text
            x={center}
            y={center - 6}
            textAnchor="middle"
            className="fill-gray-900 font-bold"
            fontSize={20}
          >
            {total}
          </text>
          <text
            x={center}
            y={center + 12}
            textAnchor="middle"
            className="fill-gray-400"
            fontSize={10}
          >
            total
          </text>
        </svg>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {slices.map((slice, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-gray-700">{slice.label}</span>
              <span className="ml-auto font-medium text-gray-900">{slice.value}</span>
              <span className="text-xs text-gray-400">({slice.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---- SVG Bar Chart ----
function BarChart({
  data,
  title,
  color = '#6366f1',
}: {
  data: { label: string; value: number }[]
  title: string
  color?: string
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="space-y-3">
        {data.slice(0, 10).map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-28 truncate text-sm text-gray-600 text-right shrink-0">
              {d.label}
            </span>
            <div className="flex-1 h-6 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(d.value / maxValue) * 100}%`,
                  backgroundColor: color,
                  minWidth: d.value > 0 ? '8px' : '0',
                }}
              />
            </div>
            <span className="w-8 text-sm font-medium text-gray-900 text-right shrink-0">
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Main Dashboard ----
export default function AnalyticsDashboard({
  ads,
  tags = [],
}: AnalyticsDashboardProps) {
  const totalAds = ads.length
  const activeAds = ads.filter((a) => a.status === 'active').length
  const uniqueAdvertisers = new Set(ads.map((a) => a.advertiserName)).size

  // Top format
  const formatCounts = ads.reduce<Record<string, number>>((acc, ad) => {
    acc[ad.format] = (acc[ad.format] || 0) + 1
    return acc
  }, {})
  const topFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '--'

  // Saves over time (by month)
  const savesOverTime = useMemo(() => {
    const monthly: Record<string, number> = {}
    ads.forEach((ad) => {
      const date = new Date(ad.savedAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthly[key] = (monthly[key] || 0) + 1
    })
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => {
        const [year, month] = label.split('-')
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return { label: `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`, value }
      })
  }, [ads])

  // Format distribution for pie chart
  const formatDistribution = useMemo(() => {
    const colors: Record<string, string> = {
      image: '#6366f1',
      video: '#ec4899',
      carousel: '#f97316',
      collection: '#22c55e',
    }
    return Object.entries(formatCounts).map(([label, value]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value,
      color: colors[label] || '#6b7280',
    }))
  }, [formatCounts])

  // Top advertisers
  const topAdvertisers = useMemo(() => {
    const counts: Record<string, number> = {}
    ads.forEach((ad) => {
      counts[ad.advertiserName] = (counts[ad.advertiserName] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, value]) => ({ label, value }))
  }, [ads])

  // Most used tags
  const tagUsage = useMemo(() => {
    const counts: Record<string, { count: number; color: string }> = {}
    ads.forEach((ad) => {
      ad.tags?.forEach((tag) => {
        if (!counts[tag.name]) {
          counts[tag.name] = { count: 0, color: tag.color }
        }
        counts[tag.name].count++
      })
    })
    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([label, { count }]) => ({ label, value: count }))
  }, [ads])

  return (
    <div className="space-y-6 p-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Bookmark className="h-5 w-5 text-indigo-600" />}
          label="Total Ads Saved"
          value={totalAds}
          color="bg-indigo-50"
        />
        <SummaryCard
          icon={<Zap className="h-5 w-5 text-green-600" />}
          label="Active Ads"
          value={activeAds}
          subtext={totalAds > 0 ? `${((activeAds / totalAds) * 100).toFixed(0)}% of total` : undefined}
          color="bg-green-50"
        />
        <SummaryCard
          icon={<Users className="h-5 w-5 text-purple-600" />}
          label="Advertisers"
          value={uniqueAdvertisers}
          color="bg-purple-50"
        />
        <SummaryCard
          icon={<LayoutGrid className="h-5 w-5 text-amber-600" />}
          label="Top Format"
          value={topFormat.charAt(0).toUpperCase() + topFormat.slice(1)}
          subtext={topFormat !== '--' ? `${formatCounts[topFormat]} ads` : undefined}
          color="bg-amber-50"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LineChart data={savesOverTime} title="Saves Over Time" />
        <PieChart data={formatDistribution} title="Format Distribution" />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarChart data={topAdvertisers} title="Top Advertisers" color="#6366f1" />
        <BarChart data={tagUsage} title="Most Used Tags" color="#8b5cf6" />
      </div>
    </div>
  )
}
