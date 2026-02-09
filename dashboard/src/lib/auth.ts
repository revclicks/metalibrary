import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { headers, cookies } from "next/headers";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface JWTPayload {
  userId: string;
  email: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeaders(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export async function authenticateRequest(reqHeaders: Headers): Promise<JWTPayload | null> {
  const token = getTokenFromHeaders(reqHeaders);
  if (!token) return null;
  return verifyToken(token);
}

export function generateToken(payload: Record<string, string>): string {
  return signToken({ userId: payload.userId, email: payload.email });
}

export async function getCurrentUser() {
  try {
    const user = await requireAuth();
    return user;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const headersList = await headers();
  const token = getTokenFromHeaders(headersList);

  if (!token) {
    // Also try cookie
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("auth-token")?.value || cookieStore.get("token")?.value;
    if (!cookieToken) {
      throw new Error("Unauthorized");
    }
    const payload = verifyToken(cookieToken);
    if (!payload) throw new Error("Unauthorized");
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new Error("Unauthorized");
    return user;
  }

  const payload = verifyToken(token);
  if (!payload) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new Error("Unauthorized");
  return user;
}
