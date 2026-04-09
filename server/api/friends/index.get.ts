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
  const collections = db.collection('setCollections')

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
    .project({ email: 1, createdAt: 1, username: 1 })
    .toArray()

  const friendMap = new Map<
    string,
    { email: string; createdAt?: Date; username?: string | null }
  >()
  for (const u of friendUsers) {
    friendMap.set((u._id as ObjectId).toString(), {
      email: (u as any).email as string,
      createdAt: (u as any).createdAt as Date | undefined,
      username: (u as any).username ?? null,
    })
  }

  const collectionDocs = await collections
    .find({ userId: { $in: friendIds } })
    .project({ userId: 1, collectedCardIds: 1 })
    .toArray()

  const progressMap = new Map<
    string,
    { totalSetsTracked: number; totalCardsCollected: number }
  >()
  for (const c of collectionDocs) {
    const ownerId = ((c as any).userId as ObjectId).toString()
    const existing = progressMap.get(ownerId) ?? {
      totalSetsTracked: 0,
      totalCardsCollected: 0,
    }

    const collectedCardIds =
      (c as any).collectedCardIds &&
      Array.isArray((c as any).collectedCardIds)
        ? ((c as any).collectedCardIds as string[])
        : []

    existing.totalSetsTracked += 1
    existing.totalCardsCollected += collectedCardIds.length

    progressMap.set(ownerId, existing)
  }

  const items = docs.map((doc) => {
    const requesterId = (doc as any).requesterId as ObjectId
    const addresseeId = (doc as any).addresseeId as ObjectId
    const otherId = requesterId.toString() === userId.toString() ? addresseeId : requesterId
    const other = friendMap.get(otherId.toString())
    const progress = progressMap.get(otherId.toString())

    return {
      id: (doc._id as ObjectId).toString(),
      friendId: otherId.toString(),
      friendEmail: other?.email ?? 'Unknown user',
      friendUsername: other?.username ?? null,
      memberSince: other?.createdAt ?? null,
      progress: {
        totalSetsTracked: progress?.totalSetsTracked ?? 0,
        totalCardsCollected: progress?.totalCardsCollected ?? 0,
      },
      since: (doc as any).updatedAt ?? (doc as any).createdAt ?? null,
    }
  })

  return { items }
}
