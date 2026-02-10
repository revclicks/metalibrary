import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const ad = await prisma.ad.findFirst({
      where: { id, savedById: user.id },
      include: {
        adTags: { include: { tag: true } },
        adFolders: { include: { folder: true } },
        notes: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        annotations: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        carouselCards: { orderBy: { position: 'asc' } },
      },
    })

    if (!ad) {
      return errorResponse('Ad not found', 404)
    }

    return successResponse({
      ...ad,
      platforms: ad.platforms ? JSON.parse(ad.platforms) : [],
      countries: ad.countries ? JSON.parse(ad.countries) : [],
      tags: ad.adTags.map((at: any) => at.tag),
      folders: ad.adFolders.map((af: any) => af.folder),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    console.error('Get ad error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.ad.findFirst({
      where: { id, savedById: user.id },
    })
    if (!existing) {
      return errorResponse('Ad not found', 404)
    }

    const { tagIds, folderIds, ...updateData } = body

    // Handle platforms/countries serialization
    if (updateData.platforms) {
      updateData.platforms = JSON.stringify(updateData.platforms)
    }
    if (updateData.countries) {
      updateData.countries = JSON.stringify(updateData.countries)
    }
    if (updateData.adStartDate) {
      updateData.adStartDate = new Date(updateData.adStartDate)
    }
    if (updateData.adEndDate) {
      updateData.adEndDate = new Date(updateData.adEndDate)
    }

    const ad = await prisma.ad.update({
      where: { id },
      data: updateData,
    })

    // Update tags if provided
    if (tagIds !== undefined) {
      await prisma.adTag.deleteMany({ where: { adId: id } })
      if (tagIds.length > 0) {
        await prisma.adTag.createMany({
          data: tagIds.map((tagId: string) => ({ adId: id, tagId })),
        })
      }
    }

    // Update folders if provided
    if (folderIds !== undefined) {
      await prisma.adFolder.deleteMany({ where: { adId: id } })
      if (folderIds.length > 0) {
        await prisma.adFolder.createMany({
          data: folderIds.map((folderId: string) => ({ adId: id, folderId })),
        })
      }
    }

    return successResponse(ad)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    console.error('Update ad error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const existing = await prisma.ad.findFirst({
      where: { id, savedById: user.id },
    })
    if (!existing) {
      return errorResponse('Ad not found', 404)
    }

    await prisma.ad.delete({ where: { id } })

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    console.error('Delete ad error:', error)
    return errorResponse('Internal server error', 500)
  }
}
