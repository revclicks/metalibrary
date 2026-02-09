import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const folder = await prisma.folder.findFirst({
      where: { id, userId: user.id },
      include: {
        adFolders: {
          include: {
            ad: {
              include: {
                adTags: { include: { tag: true } },
              },
            },
          },
        },
        subFolders: {
          include: { _count: { select: { adFolders: true } } },
        },
        _count: { select: { adFolders: true } },
      },
    })

    if (!folder) return errorResponse('Folder not found', 404)

    return successResponse({
      ...folder,
      ads: folder.adFolders.map((af) => ({
        ...af.ad,
        tags: af.ad.adTags.map((at) => at.tag),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
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

    const existing = await prisma.folder.findFirst({ where: { id, userId: user.id } })
    if (!existing) return errorResponse('Folder not found', 404)

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.parentFolderId !== undefined) updateData.parentFolderId = body.parentFolderId
    if (body.isSmart !== undefined) updateData.isSmart = body.isSmart
    if (body.smartRules !== undefined) updateData.smartRules = JSON.stringify(body.smartRules)
    const folder = await prisma.folder.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { adFolders: true } } },
    })

    return successResponse(folder)
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

    const existing = await prisma.folder.findFirst({ where: { id, userId: user.id } })
    if (!existing) return errorResponse('Folder not found', 404)

    await prisma.folder.delete({ where: { id } })

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    return errorResponse('Internal server error', 500)
  }
}
