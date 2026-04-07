import { H3Event, sendError, createError, readBody } from 'h3'
import { setCookie } from 'h3'
import { getDb } from '../../utils/mongo'
import { comparePassword, signJwt } from '../../utils/auth'

interface LoginBody {
  email?: string
  password?: string
}

export default async function (event: H3Event) {
  const body = (await readBody(event)) as LoginBody
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'Email and password are required' })
    )
  }

  const db = await getDb()
  const users = db.collection('users')

  const user = await users.findOne({ email })
  if (!user) {
    return sendError(
      event,
      createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
    )
  }

  const valid = await comparePassword(password, (user as any).passwordHash)
  if (!valid) {
    return sendError(
      event,
      createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
    )
  }

  if (!(user as any).emailVerifiedAt) {
    return sendError(
      event,
      createError({ statusCode: 403, statusMessage: 'Please verify your email before logging in' })
    )
  }

  const token = signJwt({ sub: String(user._id), email })

  const isProd = process.env.NODE_ENV === 'production'

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return {
    ok: true,
    message: 'Logged in successfully',
  }
}
