import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // The id can be a pageId or an advertiserName (URL-encoded)
    const decodedId = decodeURIComponent(id)

    // Try to find ads by pageId first, then by advertiserName
    let ads = await prisma.ad.findMany({
      where: {
        savedById: user.id,
        pageId: decodedId,
      },
      include: {
        adTags: { include: { tag: true } },
        adFolders: { include: { folder: true } },
        carouselCards: { orderBy: { position: 'asc' } },
      },
      orderBy: { savedAt: 'desc' },
    })

    // If no ads found by pageId, try by advertiserName
    if (ads.length === 0) {
      ads = await prisma.ad.findMany({
        where: {
          savedById: user.id,
          advertiserName: decodedId,
        },
        include: {
          adTags: { include: { tag: true } },
          adFolders: { include: { folder: true } },
          carouselCards: { orderBy: { position: 'asc' } },
        },
        orderBy: { savedAt: 'desc' },
      })
    }

    if (ads.length === 0) {
      return NextResponse.json(
        { error: 'No ads found for this advertiser' },
        { status: 404 }
      )
    }

    const advertiserName = ads[0].advertiserName
    const pageId = ads[0].pageId

    // Format breakdown
    const formatCounts: Record<string, number> = {}
    const ctaCounts: Record<string, number> = {}
    const statusCounts: Record<string, number> = { active: 0, inactive: 0 }
    const timelineMap: Record<string, number> = {}

    for (const ad of ads) {
      // Format breakdown
      formatCounts[ad.format] = (formatCounts[ad.format] || 0) + 1

      // CTA distribution
      const cta = ad.ctaType || 'None'
      ctaCounts[cta] = (ctaCounts[cta] || 0) + 1

      // Status counts
      if (ad.status === 'active' || ad.status === 'inactive') {
        statusCounts[ad.status]++
      }

      // Timeline of ad activity (by month)
      const savedDate = ad.savedAt.toISOString().slice(0, 7) // YYYY-MM
      timelineMap[savedDate] = (timelineMap[savedDate] || 0) + 1
    }

    const formatBreakdown = Object.entries(formatCounts).map(
      ([format, count]) => ({ format, count })
    )

    const ctaDistribution = Object.entries(ctaCounts)
      .map(([cta, count]) => ({ cta, count }))
      .sort((a, b) => b.count - a.count)

    const timeline = Object.entries(timelineMap)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Look up advertiser profile if it exists
    let profile = null
    if (pageId) {
      profile = await prisma.advertiserProfile.findUnique({
        where: { pageId },
      })
    }

    return NextResponse.json({
      advertiserName,
      pageId,
      profile,
      totalAds: ads.length,
      statusBreakdown: statusCounts,
      formatBreakdown,
      ctaDistribution,
      timeline,
      ads,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching advertiser:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
