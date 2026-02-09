import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireAuth()

    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
      include: { _count: { select: { adTags: true } } },
      orderBy: { name: 'asc' },
    })

    return successResponse(tags)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { name, color = '#1877F2', group } = await request.json()

    if (!name) return errorResponse('Tag name is required', 400)

    const tagCount = await prisma.tag.count({ where: { userId: user.id } })
    const limits: Record<string, number> = { free: 10, pro: Infinity, agency: Infinity }
    if (tagCount >= (limits[user.plan] || 10)) {
      return errorResponse('You have reached your tag limit', 403)
    }

    const tag = await prisma.tag.create({
      data: { name, color, group, userId: user.id },
      include: { _count: { select: { adTags: true } } },
    })

    return successResponse(tag, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    return errorResponse('Internal server error', 500)
  }
}
