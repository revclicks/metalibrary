import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireAuth()

    const folders = await prisma.folder.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { adFolders: true } },
        subFolders: {
          include: { _count: { select: { adFolders: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(folders)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    console.error('Get folders error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { name, parentFolderId, isSmart, smartRules } = await request.json()

    if (!name) {
      return errorResponse('Folder name is required', 400)
    }

    // Check plan limits
    const folderCount = await prisma.folder.count({ where: { userId: user.id } })
    const limits: Record<string, number> = { free: 5, pro: Infinity, agency: Infinity }
    if (folderCount >= (limits[user.plan] || 5)) {
      return errorResponse('You have reached your folder limit', 403)
    }

    // Validate parent folder depth (max 3 levels)
    if (parentFolderId) {
      const parent = await prisma.folder.findFirst({
        where: { id: parentFolderId, userId: user.id },
        include: { parentFolder: true },
      })
      if (!parent) return errorResponse('Parent folder not found', 404)
      if (parent.parentFolder?.parentFolderId) {
        return errorResponse('Maximum folder depth is 3 levels', 400)
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        parentFolderId,
        userId: user.id,
        teamId: user.teamId,
        isSmart: isSmart || false,
        smartRules: smartRules ? JSON.stringify(smartRules) : null,
      },
      include: { _count: { select: { adFolders: true } } },
    })

    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'created_folder',
        entityType: 'folder',
        entityId: folder.id,
        metadata: JSON.stringify({ name }),
      },
    })

    return successResponse(folder, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401)
    }
    console.error('Create folder error:', error)
    return errorResponse('Internal server error', 500)
  }
}
