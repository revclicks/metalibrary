import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return errorResponse('Email and password are required', 400)
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return errorResponse('Invalid email or password', 401)
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return errorResponse('Invalid email or password', 401)
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      plan: user.plan,
    })

    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error?.message, error?.code, error)
    return errorResponse(`Internal server error: ${error?.message || 'unknown'}`, 500)
  }
}
