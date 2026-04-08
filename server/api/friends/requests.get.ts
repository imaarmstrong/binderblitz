import { H3Event, sendError, createError, getCookie } from 'h3'
import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/mongo'
import { verifyJwt } from '../../utils/auth'

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

  const db = await getDb()
  const friendships = db.collection('friendships')
  const users = db.collection('users')

  const userId = new ObjectId(payload.sub)

  const pending = await friendships
    .find({ addresseeId: userId, status: 'pending' })
    .sort({ createdAt: -1 })
    .toArray()

  const requesterIds = pending.map((doc) => (doc as any).requesterId as ObjectId)

  const requesterUsers = await users
    .find({ _id: { $in: requesterIds } })
    .project({ email: 1 })
    .toArray()

  const requesterMap = new Map<string, string>()
  for (const u of requesterUsers) {
    requesterMap.set((u._id as ObjectId).toString(), (u as any).email as string)
  }

  const items = pending.map((doc) => {
    const id = (doc._id as ObjectId).toString()
    const requesterId = ((doc as any).requesterId as ObjectId).toString()
    return {
      id,
      requesterEmail: requesterMap.get(requesterId) ?? 'Unknown user',
      createdAt: (doc as any).createdAt ?? null,
    }
  })

  return { items }
}
