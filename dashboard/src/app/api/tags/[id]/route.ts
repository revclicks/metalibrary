import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.tag.findFirst({ where: { id, userId: user.id } })
    if (!existing) return errorResponse('Tag not found', 404)

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.group !== undefined && { group: body.group }),
      },
      include: { _count: { select: { adTags: true } } },
    })

    return successResponse(tag)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
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

    const existing = await prisma.tag.findFirst({ where: { id, userId: user.id } })
    if (!existing) return errorResponse('Tag not found', 404)

    await prisma.tag.delete({ where: { id } })

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    return errorResponse('Internal server error', 500)
  }
}
