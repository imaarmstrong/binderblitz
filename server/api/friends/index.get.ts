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

  const docs = await friendships
    .find({
      status: 'accepted',
      $or: [{ requesterId: userId }, { addresseeId: userId }],
    })
    .toArray()

  const friendIds: ObjectId[] = []
  for (const doc of docs) {
    const requesterId = (doc as any).requesterId as ObjectId
    const addresseeId = (doc as any).addresseeId as ObjectId
    const otherId = requesterId.toString() === userId.toString() ? addresseeId : requesterId
    friendIds.push(otherId)
  }

  if (!friendIds.length) {
    return { items: [] }
  }

  const friendUsers = await users
    .find({ _id: { $in: friendIds } })
    .project({ email: 1, createdAt: 1 })
    .toArray()

  const friendMap = new Map<string, { email: string; createdAt?: Date }>()
  for (const u of friendUsers) {
    friendMap.set((u._id as ObjectId).toString(), {
      email: (u as any).email as string,
      createdAt: (u as any).createdAt as Date | undefined,
    })
  }

  const items = docs.map((doc) => {
    const requesterId = (doc as any).requesterId as ObjectId
    const addresseeId = (doc as any).addresseeId as ObjectId
    const otherId = requesterId.toString() === userId.toString() ? addresseeId : requesterId
    const other = friendMap.get(otherId.toString())

    return {
      id: (doc._id as ObjectId).toString(),
      friendEmail: other?.email ?? 'Unknown user',
      since: (doc as any).updatedAt ?? (doc as any).createdAt ?? null,
    }
  })

  return { items }
}
