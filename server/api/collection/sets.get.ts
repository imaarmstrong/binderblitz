import { H3Event, sendError, createError, getCookie } from 'h3'
import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/mongo'
import { verifyJwt } from '../../utils/auth'
import TCGdex from '@tcgdex/sdk'

export default async function (event: H3Event) {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    return sendError(event, createError({ statusCode: 401, statusMessage: 'Not authenticated' }))
  }

  const payload = verifyJwt<{ sub: string; email: string }>(token)
  if (!payload) {
    return sendError(event, createError({ statusCode: 401, statusMessage: 'Invalid token' }))
  }

  const db = await getDb()
  const collections = db.collection('setCollections')

  const userId = new ObjectId(payload.sub)

  const docs = await collections.find({ userId }).toArray()

  if (!docs.length) {
    return { items: [] as any[] }
  }

  const tcgdex = new TCGdex('en')

  const items = await Promise.all(
    docs.map(async (doc) => {
      const setId = doc.setId as string
      let name = setId
      let logo: string | undefined
      let totalCards: number | null = typeof doc.totalCards === 'number' ? (doc.totalCards as number) : null

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
        // ignore metadata errors; we still return the raw set id
      }

      const collectedCardIds = (doc.collectedCardIds as string[]) ?? []

      return {
        setId,
        name,
        logo,
        totalCards,
        collectedCardCount: collectedCardIds.length,
      }
    }),
  )

  return { items }
}
