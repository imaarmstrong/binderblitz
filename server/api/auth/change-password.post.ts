import { H3Event, readBody, sendError, createError, getCookie } from 'h3'
import { getDb } from '../../utils/mongo'
import { comparePassword, hashPassword, verifyJwt } from '../../utils/auth'
import { ObjectId } from 'mongodb'

interface ChangePasswordBody {
  currentPassword?: string
  newPassword?: string
}

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

  const body = (await readBody(event)) as ChangePasswordBody
  const currentPassword = body.currentPassword || ''
  const newPassword = body.newPassword || ''

  if (!currentPassword || !newPassword) {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'Current and new passwords are required' })
    )
  }

  if (newPassword.length < 8) {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'New password must be at least 8 characters' })
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

  const valid = await comparePassword(currentPassword, (user as any).passwordHash)
  if (!valid) {
    return sendError(
      event,
      createError({ statusCode: 401, statusMessage: 'Current password is incorrect' })
    )
  }

  const newHash = await hashPassword(newPassword)
  await users.updateOne({ _id: user._id }, { $set: { passwordHash: newHash } })

  return { ok: true, message: 'Password updated successfully' }
}
