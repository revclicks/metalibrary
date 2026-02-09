import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, paginatedResponse, parsePagination } from '@/lib/api'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const { page, pageSize, skip } = parsePagination(searchParams)

    // Build filters
    const where: Record<string, unknown> = { savedById: user.id }

    const search = searchParams.get('search')
    if (search) {
      where.OR = [
        { primaryText: { contains: search } },
        { headline: { contains: search } },
        { description: { contains: search } },
        { advertiserName: { contains: search } },
      ]
    }

    const format = searchParams.get('format')
    if (format) where.format = format

    const status = searchParams.get('status')
    if (status) where.status = status

    const starred = searchParams.get('starred')
    if (starred === 'true') where.starred = true

    const advertiser = searchParams.get('advertiser')
    if (advertiser) where.advertiserName = { contains: advertiser }

    const ctaType = searchParams.get('ctaType')
    if (ctaType) where.ctaType = ctaType

    const folderId = searchParams.get('folderId')
    if (folderId) {
      where.adFolders = { some: { folderId } }
    }

    const tagId = searchParams.get('tagId')
    if (tagId) {
      where.adTags = { some: { tagId } }
    }

    // Sort
    const sortBy = searchParams.get('sortBy') || 'savedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const orderBy: Record<string, string> = { [sortBy]: sortOrder }

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        include: {
          adTags: { include: { tag: true } },
          adFolders: { include: { folder: true } },
          _count: { select: { notes: true, carouselCards: true } },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.ad.count({ where }),
    ])

    // Transform to flatten tags and folders
    const transformed = ads.map((ad) => ({
      ...ad,
      platforms: ad.platforms ? JSON.parse(ad.platforms) : [],
      countries: ad.countries ? JSON.parse(ad.countries) : [],
      tags: ad.adTags.map((at) => at.tag),
      folders: ad.adFolders.map((af) => af.folder),
    }))

    return paginatedResponse(transformed, total, page, pageSize)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    console.error('Get ads error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const {
      adLibraryId,
      advertiserName,
      pageId,
      format = 'image',
      status = 'active',
      primaryText,
      headline,
      description,
      ctaType,
      destinationUrl,
      displayUrl,
      creativeUrl,
      videoUrl,
      screenshotUrl,
      platforms,
      countries,
      adStartDate,
      adEndDate,
      starred = false,
      folderIds = [],
      tagIds = [],
      note,
      carouselCards = [],
    } = body

    if (!advertiserName) {
      return errorResponse('Advertiser name is required', 400)
    }

    // Check for duplicates
    if (adLibraryId) {
      const existing = await prisma.ad.findUnique({ where: { adLibraryId } })
      if (existing) {
        return errorResponse('This ad has already been saved', 409)
      }
    }

    // Check plan limits
    const adCount = await prisma.ad.count({ where: { savedById: user.id } })
    const planLimits: Record<string, number> = { free: 50, pro: Infinity, agency: Infinity }
    if (adCount >= (planLimits[user.plan] || 50)) {
      return errorResponse('You have reached your plan limit for saved ads', 403)
    }

    const ad = await prisma.ad.create({
      data: {
        adLibraryId,
        advertiserName,
        pageId,
        format,
        status,
        primaryText,
        headline,
        description,
        ctaType,
        destinationUrl,
        displayUrl,
        creativeUrl,
        videoUrl,
        screenshotUrl,
        platforms: platforms ? JSON.stringify(platforms) : null,
        countries: countries ? JSON.stringify(countries) : null,
        adStartDate: adStartDate ? new Date(adStartDate) : null,
        adEndDate: adEndDate ? new Date(adEndDate) : null,
        starred,
        savedById: user.id,
        // Create carousel cards
        carouselCards: carouselCards.length > 0 ? {
          create: carouselCards.map((card: { position: number; imageUrl?: string; headline?: string; description?: string; url?: string }) => ({
            position: card.position,
            imageUrl: card.imageUrl,
            headline: card.headline,
            description: card.description,
            url: card.url,
          })),
        } : undefined,
        // Connect tags
        adTags: tagIds.length > 0 ? {
          create: tagIds.map((tagId: string) => ({ tagId })),
        } : undefined,
        // Connect folders
        adFolders: folderIds.length > 0 ? {
          create: folderIds.map((folderId: string) => ({ folderId })),
        } : undefined,
      },
      include: {
        adTags: { include: { tag: true } },
        adFolders: { include: { folder: true } },
        carouselCards: true,
      },
    })

    // Create note if provided
    if (note) {
      await prisma.note.create({
        data: { adId: ad.id, userId: user.id, content: note },
      })
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'saved_ad',
        entityType: 'ad',
        entityId: ad.id,
        metadata: JSON.stringify({ advertiserName }),
      },
    })

    // Update advertiser profile
    await prisma.advertiserProfile.upsert({
      where: { pageId: pageId || `manual-${advertiserName}` },
      update: { totalAdsSaved: { increment: 1 } },
      create: {
        pageId: pageId || `manual-${advertiserName}`,
        name: advertiserName,
        totalAdsSaved: 1,
      },
    })

    return successResponse(ad, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    console.error('Create ad error:', error)
    return errorResponse('Internal server error', 500)
  }
}
