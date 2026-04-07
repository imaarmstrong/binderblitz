import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const DEFAULT_JWT_EXPIRES_IN = '7d'

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signJwt(payload: object) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables')
  }

  return jwt.sign(payload, secret, { expiresIn: DEFAULT_JWT_EXPIRES_IN })
}

export function verifyJwt<T = any>(token: string): T | null {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables')
  }
  try {
    return jwt.verify(token, secret) as T
  } catch {
    return null
  }
}

export function generateVerificationCode(): string {
  // 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString()
}
