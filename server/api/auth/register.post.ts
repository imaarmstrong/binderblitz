import { H3Event, sendError, createError, readBody } from 'h3'
import { getDb } from '../../utils/mongo'
import { generateVerificationCode, hashPassword } from '../../utils/auth'

interface RegisterBody {
  email?: string
  password?: string
}

export default async function (event: H3Event) {
  const body = (await readBody(event)) as RegisterBody

  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'Email and password are required' })
    )
  }

  if (password.length < 8) {
    return sendError(
      event,
      createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters' })
    )
  }

  const db = await getDb()
  const users = db.collection('users')

  const existing = await users.findOne({ email })
  if (existing) {
    return sendError(
      event,
      createError({ statusCode: 409, statusMessage: 'Email is already registered' })
    )
  }

  const passwordHash = await hashPassword(password)
  const now = new Date()

  // First user becomes owner, others are regular users.
  const userCount = await users.countDocuments({})
  const role = userCount === 0 ? 'owner' : 'user'

  const { insertedId } = await users.insertOne({
    email,
    passwordHash,
    role,
    createdAt: now,
    emailVerifiedAt: null,
  })

  const codes = db.collection('emailVerificationCodes')
  const code = generateVerificationCode()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await codes.insertOne({
    userId: insertedId,
    email,
    code,
    createdAt: now,
    expiresAt,
    usedAt: null,
  })

  // For now, we just log the code on the server. In a real app,
  // you would send this via an email provider (e.g. Resend, SendGrid).
  // eslint-disable-next-line no-console
  console.log(`Verification code for ${email}: ${code}`)

  return {
    ok: true,
    message: 'Registration successful. Check your email for the verification code.',
    // During local development you might want to see the code directly in the response.
    // Remove this in production.
    code: process.env.NODE_ENV !== 'production' ? code : undefined,
  }
}
