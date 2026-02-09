import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }
  return successResponse({ user })
}
