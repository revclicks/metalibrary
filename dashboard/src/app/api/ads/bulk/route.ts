import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { action, adIds, tagIds, folderId } = await request.json()

    if (!adIds || !Array.isArray(adIds) || adIds.length === 0) {
      return errorResponse('Ad IDs are required', 400)
    }

    // Verify ownership
    const ads = await prisma.ad.findMany({
      where: { id: { in: adIds }, savedById: user.id },
      select: { id: true },
    })
    const ownedIds = ads.map((a) => a.id)

    switch (action) {
      case 'addTags':
        if (!tagIds || tagIds.length === 0) return errorResponse('Tag IDs required', 400)
        for (const adId of ownedIds) {
          for (const tagId of tagIds) {
            await prisma.adTag.upsert({
              where: { adId_tagId: { adId, tagId } },
              update: {},
              create: { adId, tagId },
            })
          }
        }
        break

      case 'removeTags':
        if (!tagIds || tagIds.length === 0) return errorResponse('Tag IDs required', 400)
        await prisma.adTag.deleteMany({
          where: { adId: { in: ownedIds }, tagId: { in: tagIds } },
        })
        break

      case 'moveToFolder':
        if (!folderId) return errorResponse('Folder ID required', 400)
        for (const adId of ownedIds) {
          await prisma.adFolder.upsert({
            where: { adId_folderId: { adId, folderId } },
            update: {},
            create: { adId, folderId },
          })
        }
        break

      case 'star':
        await prisma.ad.updateMany({
          where: { id: { in: ownedIds } },
          data: { starred: true },
        })
        break

      case 'unstar':
        await prisma.ad.updateMany({
          where: { id: { in: ownedIds } },
          data: { starred: false },
        })
        break

      case 'delete':
        await prisma.ad.deleteMany({
          where: { id: { in: ownedIds } },
        })
        break

      default:
        return errorResponse('Invalid action', 400)
    }

    return successResponse({ success: true, affected: ownedIds.length })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    console.error('Bulk action error:', error)
    return errorResponse('Internal server error', 500)
  }
}
