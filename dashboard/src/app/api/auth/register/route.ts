import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return errorResponse('Email and password are required', 400)
    }

    if (password.length < 8) {
      return errorResponse('Password must be at least 8 characters', 400)
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return errorResponse('An account with this email already exists', 409)
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
      },
    })

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
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
    }, 201)
  } catch (error: any) {
    console.error('Registration error:', error?.message, error?.code, error)
    return errorResponse(`Internal server error: ${error?.message || 'unknown'}`, 500)
  }
}
