import bcrypt from 'bcryptjs'
import { redis } from '@/lib/redis'

export interface StoredUser {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string
}

const memoryUsers = new Map<string, StoredUser>()

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function userKey(email: string): string {
  return `auth:user:${normalizeEmail(email)}`
}

async function readUser(email: string): Promise<StoredUser | null> {
  const key = userKey(email)
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      return await redis.get<StoredUser>(key)
    }
  } catch {
    // fall through to memory
  }
  return memoryUsers.get(key) ?? null
}

async function writeUser(user: StoredUser): Promise<void> {
  const key = userKey(user.email)
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      await redis.set(key, user)
      return
    }
  } catch {
    // fall through to memory
  }
  memoryUsers.set(key, user)
}

export async function registerUser(params: {
  email: string
  password: string
  name?: string
}): Promise<{ ok: true; user: StoredUser } | { ok: false; error: string }> {
  const email = normalizeEmail(params.email)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'INVALID_EMAIL' }
  }
  if (params.password.length < 8) {
    return { ok: false, error: 'WEAK_PASSWORD' }
  }

  const existing = await readUser(email)
  if (existing) {
    return { ok: false, error: 'EMAIL_EXISTS' }
  }

  const passwordHash = await bcrypt.hash(params.password, 12)
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email,
    name: params.name?.trim() || email.split('@')[0] || 'User',
    passwordHash,
    createdAt: new Date().toISOString(),
  }

  await writeUser(user)
  return { ok: true, user }
}

export async function verifyUserCredentials(
  email: string,
  password: string
): Promise<StoredUser | null> {
  const user = await readUser(email)
  if (!user) return null
  const valid = await bcrypt.compare(password, user.passwordHash)
  return valid ? user : null
}
