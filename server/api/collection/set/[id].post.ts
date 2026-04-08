import { H3Event, sendError, createError, getCookie, readBody } from 'h3'
import { ObjectId } from 'mongodb'
import { getDb } from '../../../utils/mongo'
import { verifyJwt } from '../../../utils/auth'

interface BodyShape {
  collectedCardIds?: string[]
  totalCards?: number
}

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
  const setId = event.context.params?.id as string | undefined

  if (!setId) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Set id is required' }))
  }

  const body = (await readBody(event)) as BodyShape
  const collectedCardIds = Array.isArray(body.collectedCardIds)
    ? Array.from(new Set(body.collectedCardIds.filter((id) => typeof id === 'string' && id.length > 0)))
    : []

  const totalCards = typeof body.totalCards === 'number' && body.totalCards > 0 ? body.totalCards : undefined

  const now = new Date()

  const update: any = {
    $set: {
      userId,
      setId,
      collectedCardIds,
      updatedAt: now,
    },
    $setOnInsert: {
      createdAt: now,
    },
  }

  if (typeof totalCards === 'number') {
    update.$set.totalCards = totalCards
  }

  const result = await collections.findOneAndUpdate(
    { userId, setId },
    update,
    { upsert: true, returnDocument: 'after' },
  )

  const doc = result.value ?? (await collections.findOne({ userId, setId }))

  return {
    ok: true,
    setId,
    collectedCardIds: (doc?.collectedCardIds as string[]) ?? collectedCardIds,
    totalCards: typeof doc?.totalCards === 'number' ? (doc.totalCards as number) : totalCards ?? null,
  }
}
