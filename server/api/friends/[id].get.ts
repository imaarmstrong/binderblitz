import { H3Event, sendError, createError, getCookie } from 'h3'
import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/mongo'
import { verifyJwt } from '../../utils/auth'
import TCGdex from '@tcgdex/sdk'

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

  const friendIdParam = event.context.params?.id as string | undefined
  if (!friendIdParam) {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'Friend id is required' }),
    )
  }

  let friendId: ObjectId
  try {
    friendId = new ObjectId(friendIdParam)
  } catch {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'Invalid friend id' }),
    )
  }

  const db = await getDb()
  const friendships = db.collection('friendships')
  const users = db.collection('users')
  const collections = db.collection('setCollections')

  const userId = new ObjectId(payload.sub)

  const friendship = await friendships.findOne({
    status: 'accepted',
    $or: [
      { requesterId: userId, addresseeId: friendId },
      { requesterId: friendId, addresseeId: userId },
    ],
  })

  if (!friendship) {
    return sendError(
      event,
      createError({ statusCode: 404, statusMessage: 'Friend not found' }),
    )
  }

  const friendUser = await users.findOne({ _id: friendId })
  if (!friendUser) {
    return sendError(
      event,
      createError({ statusCode: 404, statusMessage: 'User not found' }),
    )
  }

  const collectionDocs = await collections
    .find({ userId: friendId })
    .toArray()

  if (!collectionDocs.length) {
    return {
      profile: {
        id: friendId.toString(),
        email: (friendUser as any).email as string,
        username: (friendUser as any).username ?? null,
        memberSince: (friendUser as any).createdAt ?? null,
      },
      friendship: {
        since: (friendship as any).updatedAt ?? (friendship as any).createdAt ?? null,
      },
      sets: [] as any[],
    }
  }

  const tcgdex = new TCGdex('en')

  const sets = await Promise.all(
    collectionDocs.map(async (doc) => {
      const setId = (doc as any).setId as string
      let name = setId
      let logo: string | undefined
      let totalCards: number | null =
        typeof (doc as any).totalCards === 'number' ? ((doc as any).totalCards as number) : null

      try {
        const rawSet: any = await (tcgdex as any).set.get(setId)
        name = rawSet.name ?? setId
        logo = rawSet.logo
        if (totalCards === null) {
          totalCards = Array.isArray(rawSet.cards)
            ? rawSet.cards.length
            : typeof rawSet.cardCount?.official === 'number'
              ? rawSet.cardCount.official
              : typeof rawSet.cardCount === 'number'
                ? rawSet.cardCount
                : null
        }
      } catch {
        // ignore metadata errors; still return basic info
      }

      const collectedCardIds = ((doc as any).collectedCardIds as string[]) ?? []

      return {
        setId,
        name,
        logo,
        totalCards,
        collectedCardCount: collectedCardIds.length,
      }
    }),
  )

  return {
    profile: {
      id: friendId.toString(),
      email: (friendUser as any).email as string,
      username: (friendUser as any).username ?? null,
      memberSince: (friendUser as any).createdAt ?? null,
    },
    friendship: {
      since: (friendship as any).updatedAt ?? (friendship as any).createdAt ?? null,
    },
    sets,
  }
}
