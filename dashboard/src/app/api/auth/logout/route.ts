import { cookies } from 'next/headers'
import { successResponse } from '@/lib/api'
export const dynamic = 'force-dynamic'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
  return successResponse({ success: true })
}
