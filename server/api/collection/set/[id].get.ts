import { H3Event, sendError, createError, getCookie } from 'h3'
import { ObjectId } from 'mongodb'
import { getDb } from '../../../utils/mongo'
import { verifyJwt } from '../../../utils/auth'

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

  const doc = await collections.findOne({ userId, setId })

  if (!doc) {
    return {
      exists: false,
      setId,
      collectedCardIds: [] as string[],
      totalCards: null as number | null,
    }
  }

  return {
    exists: true,
    setId: doc.setId as string,
    collectedCardIds: (doc.collectedCardIds as string[]) ?? [],
    totalCards: typeof doc.totalCards === 'number' ? (doc.totalCards as number) : null,
  }
}
