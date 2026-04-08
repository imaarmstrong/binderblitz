import { H3Event, sendError, createError, readBody, getCookie } from 'h3'
import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/mongo'
import { verifyJwt } from '../../utils/auth'

interface AcceptBody {
  friendshipId?: string
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

  const body = (await readBody(event)) as AcceptBody
  const friendshipId = body.friendshipId

  if (!friendshipId) {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'friendshipId is required' }),
    )
  }

  let id: ObjectId
  try {
    id = new ObjectId(friendshipId)
  } catch {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'Invalid friendshipId' }),
    )
  }

  const db = await getDb()
  const friendships = db.collection('friendships')

  const userId = new ObjectId(payload.sub)

  const existing = await friendships.findOne({ _id: id })

  if (!existing) {
    return sendError(
      event,
      createError({ statusCode: 404, statusMessage: 'Friend request not found' }),
    )
  }

  if ((existing as any).addresseeId?.toString() !== userId.toString()) {
    return sendError(
      event,
      createError({ statusCode: 403, statusMessage: 'You cannot accept this request' }),
    )
  }

  if ((existing as any).status !== 'pending') {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'Request is not pending' }),
    )
  }

  const now = new Date()

  await friendships.updateOne(
    { _id: id },
    {
      $set: {
        status: 'accepted',
        updatedAt: now,
      },
    },
  )

  return {
    ok: true,
    message: 'Friend request accepted',
  }
}
