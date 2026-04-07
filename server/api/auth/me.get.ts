import { H3Event, sendError, createError, getCookie } from 'h3'
import { verifyJwt } from '../../utils/auth'
import { getDb } from '../../utils/mongo'
import { ObjectId } from 'mongodb'

export default async function (event: H3Event) {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    return sendError(
      event,
      createError({ statusCode: 401, statusMessage: 'Not authenticated' })
    )
  }

  const payload = verifyJwt<{ sub: string; email: string }>(token)
  if (!payload) {
    return sendError(
      event,
      createError({ statusCode: 401, statusMessage: 'Invalid token' })
    )
  }

  const db = await getDb()
  const users = db.collection('users')

  const user = await users.findOne({ _id: new ObjectId(payload.sub) })
  if (!user) {
    return sendError(
      event,
      createError({ statusCode: 404, statusMessage: 'User not found' })
    )
  }

  return {
    email: (user as any).email,
    emailVerifiedAt: (user as any).emailVerifiedAt,
    createdAt: (user as any).createdAt,
    role: (user as any).role,
  }
}
