import { H3Event, sendError, createError, readBody } from 'h3'
import { getDb } from '../../utils/mongo'

interface VerifyBody {
  email?: string
  code?: string
}

export default async function (event: H3Event) {
  const body = (await readBody(event)) as VerifyBody
  const email = body.email?.trim().toLowerCase()
  const code = body.code?.trim()

  if (!email || !code) {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'Email and code are required' })
    )
  }

  const db = await getDb()
  const users = db.collection('users')
  const codes = db.collection('emailVerificationCodes')

  const user = await users.findOne({ email })
  if (!user) {
    return sendError(
      event,
      createError({ statusCode: 404, statusMessage: 'User not found' })
    )
  }

  const now = new Date()
  const record = await codes.findOne({
    userId: user._id,
    email,
    code,
    usedAt: null,
    expiresAt: { $gt: now },
  })

  if (!record) {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'Invalid or expired code' })
    )
  }

  await codes.updateOne({ _id: record._id }, { $set: { usedAt: now } })
  await users.updateOne({ _id: user._id }, { $set: { emailVerifiedAt: now } })

  return {
    ok: true,
    message: 'Email verified successfully. You can now log in.',
  }
}
