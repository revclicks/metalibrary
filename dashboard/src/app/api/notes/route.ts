import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { adId, content } = await request.json()

    if (!adId || !content) return errorResponse('Ad ID and content are required', 400)

    const ad = await prisma.ad.findFirst({ where: { id: adId, savedById: user.id } })
    if (!ad) return errorResponse('Ad not found', 404)

    const note = await prisma.note.create({
      data: { adId, userId: user.id, content },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    })

    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'added_note',
        entityType: 'note',
        entityId: note.id,
        metadata: JSON.stringify({ adId }),
      },
    })

    return successResponse(note, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    return errorResponse('Internal server error', 500)
  }
}
