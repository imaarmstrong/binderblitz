import { H3Event, sendError, createError, readBody, getCookie } from 'h3'
import { ObjectId } from 'mongodb'
import { verifyJwt } from '../../utils/auth'
import { getDb } from '../../utils/mongo'

interface ProfileBody {
  firstName?: string
  lastName?: string
  username?: string
}

export default async function (event: H3Event) {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    return sendError(
      event,
      createError({ statusCode: 401, statusMessage: 'Not authenticated' }),
    )
  }

  const payload = verifyJwt<{ sub: string; email: string }>(token)
  if (!payload) {
    return sendError(
      event,
      createError({ statusCode: 401, statusMessage: 'Invalid token' }),
    )
  }

  const body = (await readBody(event)) as ProfileBody

  const firstNameRaw = body.firstName ?? undefined
  const lastNameRaw = body.lastName ?? undefined
  const usernameRaw = body.username ?? undefined

  const firstName = firstNameRaw !== undefined ? firstNameRaw.trim() : undefined
  const lastName = lastNameRaw !== undefined ? lastNameRaw.trim() : undefined
  const username = usernameRaw !== undefined && usernameRaw.trim().length > 0
    ? usernameRaw.trim().toLowerCase()
    : undefined

  const db = await getDb()
  const users = db.collection('users')

  const userId = new ObjectId(payload.sub)

  if (usernameRaw !== undefined) {
    if (username && username.length < 3) {
      return sendError(
        event,
        createError({ statusCode: 400, statusMessage: 'Username must be at least 3 characters' }),
      )
    }

    if (username) {
      const existing = await users.findOne({
        username,
        _id: { $ne: userId },
      })

      if (existing) {
        return sendError(
          event,
          createError({ statusCode: 409, statusMessage: 'Username is already taken' }),
        )
      }
    }
  }

  const now = new Date()
  const update: Record<string, any> = { updatedAt: now }

  if (firstNameRaw !== undefined) {
    update.firstName = firstName && firstName.length > 0 ? firstName : null
  }

  if (lastNameRaw !== undefined) {
    update.lastName = lastName && lastName.length > 0 ? lastName : null
  }

  if (usernameRaw !== undefined) {
    update.username = username && username.length > 0 ? username : null
  }

  await users.updateOne(
    { _id: userId },
    { $set: update },
  )

  const updatedUser = await users.findOne({ _id: userId })

  return {
    ok: true,
    user: {
      email: (updatedUser as any).email,
      firstName: (updatedUser as any).firstName ?? null,
      lastName: (updatedUser as any).lastName ?? null,
      username: (updatedUser as any).username ?? null,
      role: (updatedUser as any).role,
      emailVerifiedAt: (updatedUser as any).emailVerifiedAt,
      createdAt: (updatedUser as any).createdAt,
    },
  }
}
