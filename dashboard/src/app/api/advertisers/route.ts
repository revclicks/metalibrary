import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''

    // Get all unique advertisers from saved ads using groupBy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { savedById: user.id }

    if (search) {
      where.advertiserName = { contains: search }
    }

    // Get advertiser aggregations
    const advertiserGroups = await prisma.ad.groupBy({
      by: ['advertiserName', 'pageId'],
      where,
      _count: true,
      orderBy: { _count: { advertiserName: 'desc' } },
    })

    const total = advertiserGroups.length

    // Paginate the results
    const paginatedGroups = advertiserGroups.slice(skip, skip + limit)

    // For each advertiser, get format breakdown and active/inactive ratio
    const advertisers = await Promise.all(
      paginatedGroups.map(async (group) => {
        const advertiserWhere = {
          savedById: user.id,
          advertiserName: group.advertiserName,
        }

        const [formatBreakdown, statusBreakdown] = await Promise.all([
          prisma.ad.groupBy({
            by: ['format'],
            where: advertiserWhere,
            _count: true,
          }),
          prisma.ad.groupBy({
            by: ['status'],
            where: advertiserWhere,
            _count: true,
          }),
        ])

        const activeCount =
          statusBreakdown.find((s) => s.status === 'active')?._count || 0
        const inactiveCount =
          statusBreakdown.find((s) => s.status === 'inactive')?._count || 0

        return {
          advertiserName: group.advertiserName,
          pageId: group.pageId,
          adCount: group._count,
          formatBreakdown: formatBreakdown.map((f) => ({
            format: f.format,
            count: f._count,
          })),
          activeCount,
          inactiveCount,
          activeRatio:
            group._count > 0
              ? Math.round((activeCount / group._count) * 100)
              : 0,
        }
      })
    )

    return NextResponse.json({
      advertisers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching advertisers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
