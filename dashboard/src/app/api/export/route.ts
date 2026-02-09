import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { exportSchema } from '@/lib/validations'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = exportSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { format, adIds, folderId } = parsed.data

    // Build the where clause to filter ads
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { savedById: user.id }

    if (adIds && adIds.length > 0) {
      where.id = { in: adIds }
    }

    if (folderId) {
      where.adFolders = { some: { folderId } }
    }

    // Fetch ads with relations
    const ads = await prisma.ad.findMany({
      where,
      include: {
        adTags: { include: { tag: true } },
        adFolders: { include: { folder: true } },
        carouselCards: { orderBy: { position: 'asc' } },
        notes: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { savedAt: 'desc' },
    })

    if (format === 'json') {
      // Return JSON export
      const exportData = ads.map((ad) => ({
        id: ad.id,
        adLibraryId: ad.adLibraryId,
        advertiserName: ad.advertiserName,
        pageId: ad.pageId,
        format: ad.format,
        status: ad.status,
        primaryText: ad.primaryText,
        headline: ad.headline,
        description: ad.description,
        ctaType: ad.ctaType,
        destinationUrl: ad.destinationUrl,
        displayUrl: ad.displayUrl,
        creativeUrl: ad.creativeUrl,
        videoUrl: ad.videoUrl,
        screenshotUrl: ad.screenshotUrl,
        platforms: ad.platforms ? safeParse(ad.platforms) : [],
        countries: ad.countries ? safeParse(ad.countries) : [],
        adStartDate: ad.adStartDate?.toISOString() || null,
        adEndDate: ad.adEndDate?.toISOString() || null,
        starred: ad.starred,
        savedAt: ad.savedAt.toISOString(),
        tags: ad.adTags.map((at) => at.tag.name),
        folders: ad.adFolders.map((af) => af.folder.name),
        carouselCards: ad.carouselCards,
        notes: ad.notes.map((n) => n.content),
      }))

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="ads-export-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      })
    }

    // CSV export
    const csvHeaders = [
      'Ad Library ID',
      'Advertiser',
      'Page ID',
      'Format',
      'Status',
      'Primary Text',
      'Headline',
      'Description',
      'CTA Type',
      'Destination URL',
      'Display URL',
      'Creative URL',
      'Video URL',
      'Screenshot URL',
      'Platforms',
      'Countries',
      'Start Date',
      'End Date',
      'Starred',
      'Tags',
      'Folders',
      'Notes',
      'Carousel Cards',
      'Saved At',
    ]

    const escapeCSV = (val: string | null | undefined): string => {
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }

    const rows = ads.map((ad) =>
      [
        escapeCSV(ad.adLibraryId),
        escapeCSV(ad.advertiserName),
        escapeCSV(ad.pageId),
        escapeCSV(ad.format),
        escapeCSV(ad.status),
        escapeCSV(ad.primaryText),
        escapeCSV(ad.headline),
        escapeCSV(ad.description),
        escapeCSV(ad.ctaType),
        escapeCSV(ad.destinationUrl),
        escapeCSV(ad.displayUrl),
        escapeCSV(ad.creativeUrl),
        escapeCSV(ad.videoUrl),
        escapeCSV(ad.screenshotUrl),
        escapeCSV(ad.platforms ? safeParse(ad.platforms).join('; ') : ''),
        escapeCSV(ad.countries ? safeParse(ad.countries).join('; ') : ''),
        escapeCSV(ad.adStartDate?.toISOString()),
        escapeCSV(ad.adEndDate?.toISOString()),
        escapeCSV(ad.starred ? 'Yes' : 'No'),
        escapeCSV(ad.adTags.map((at) => at.tag.name).join('; ')),
        escapeCSV(ad.adFolders.map((af) => af.folder.name).join('; ')),
        escapeCSV(ad.notes.map((n) => n.content).join(' | ')),
        escapeCSV(String(ad.carouselCards.length)),
        escapeCSV(ad.savedAt.toISOString()),
      ].join(',')
    )

    const csv = [csvHeaders.join(','), ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ads-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error exporting ads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function safeParse(value: string): string[] {
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}
