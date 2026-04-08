import { H3Event, sendError, createError, readBody, getCookie } from 'h3'
import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/mongo'
import { verifyJwt } from '../../utils/auth'

interface RequestBody {
  email?: string
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

  const body = (await readBody(event)) as RequestBody
  const targetEmail = body.email?.trim().toLowerCase()

  if (!targetEmail) {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'Friend email is required' }),
    )
  }

  if (targetEmail === payload.email.toLowerCase()) {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'You cannot add yourself as a friend' }),
    )
  }

  const db = await getDb()
  const users = db.collection('users')
  const friendships = db.collection('friendships')

  const userId = new ObjectId(payload.sub)

  const targetUser = await users.findOne({ email: targetEmail })
  if (!targetUser?._id) {
    return sendError(
      event,
      createError({ statusCode: 404, statusMessage: 'User with that email was not found' }),
    )
  }

  const targetUserId = targetUser._id as ObjectId

  const existing = await friendships.findOne({
    $or: [
      { requesterId: userId, addresseeId: targetUserId },
      { requesterId: targetUserId, addresseeId: userId },
    ],
  })

  if (existing) {
    const status = (existing as any).status as string
    if (status === 'accepted') {
      return sendError(
        event,
        createError({ statusCode: 400, statusMessage: 'You are already friends' }),
      )
    }

    if (
      status === 'pending' &&
      (existing as any).requesterId &&
      (existing as any).requesterId.toString() === userId.toString()
    ) {
      return sendError(
        event,
        createError({ statusCode: 400, statusMessage: 'Friend request already sent' }),
      )
    }
  }

  const now = new Date()

  await friendships.insertOne({
    requesterId: userId,
    addresseeId: targetUserId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  })

  return {
    ok: true,
    message: 'Friend request sent',
  }
}
