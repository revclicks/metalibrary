import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth()

    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      totalAds,
      adsByFormat,
      adsByStatus,
      topAdvertisers,
      recentAds,
      tagUsage,
    ] = await Promise.all([
      // Total ads saved
      prisma.ad.count({ where: { savedById: user.id } }),

      // Ads by format (pie chart data)
      prisma.ad.groupBy({
        by: ['format'],
        where: { savedById: user.id },
        _count: true,
      }),

      // Ads by status
      prisma.ad.groupBy({
        by: ['status'],
        where: { savedById: user.id },
        _count: true,
      }),

      // Top advertisers by count
      prisma.ad.groupBy({
        by: ['advertiserName'],
        where: { savedById: user.id },
        _count: true,
        orderBy: { _count: { advertiserName: 'desc' } },
        take: 10,
      }),

      // Saves over time (last 30 days)
      prisma.ad.findMany({
        where: {
          savedById: user.id,
          savedAt: { gte: thirtyDaysAgo },
        },
        select: { savedAt: true },
        orderBy: { savedAt: 'asc' },
      }),

      // Most used tags
      prisma.tag.findMany({
        where: { userId: user.id },
        include: {
          _count: { select: { adTags: true } },
        },
        orderBy: {
          adTags: { _count: 'desc' },
        },
        take: 10,
      }),
    ])

    // Group saves by day for the last 30 days
    const savesOverTime: Record<string, number> = {}

    // Initialize all 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      savesOverTime[dateStr] = 0
    }

    // Fill in actual counts
    for (const ad of recentAds) {
      const dateStr = ad.savedAt.toISOString().split('T')[0]
      if (savesOverTime[dateStr] !== undefined) {
        savesOverTime[dateStr]++
      }
    }

    const savesOverTimeArray = Object.entries(savesOverTime).map(
      ([date, count]) => ({ date, count })
    )

    return NextResponse.json({
      totalAds,
      adsByFormat: adsByFormat.map((f) => ({
        format: f.format,
        count: f._count,
      })),
      adsByStatus: adsByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      topAdvertisers: topAdvertisers.map((a) => ({
        name: a.advertiserName,
        count: a._count,
      })),
      savesOverTime: savesOverTimeArray,
      mostUsedTags: tagUsage.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        group: t.group,
        count: t._count.adTags,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
