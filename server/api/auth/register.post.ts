import { H3Event, sendError, createError, readBody } from 'h3'
import { getDb } from '../../utils/mongo'
import { generateVerificationCode, hashPassword } from '../../utils/auth'
import { sendVerificationEmail } from '../../utils/email'

interface RegisterBody {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  username?: string
}

export default async function (event: H3Event) {
  const body = (await readBody(event)) as RegisterBody

  const email = body.email?.trim().toLowerCase()
  const password = body.password
  const firstName = body.firstName?.trim() || undefined
  const lastName = body.lastName?.trim() || undefined
  const usernameRaw = body.username?.trim() || undefined
  const username = usernameRaw ? usernameRaw.toLowerCase() : undefined

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

   if (username) {
    if (username.length < 3) {
      return sendError(
        event,
        createError({ statusCode: 400, statusMessage: 'Username must be at least 3 characters' })
      )
    }

    const usernameTaken = await users.findOne({ username })
    if (usernameTaken) {
      return sendError(
        event,
        createError({ statusCode: 409, statusMessage: 'Username is already taken' })
      )
    }
  }

  const { insertedId } = await users.insertOne({
    email,
    passwordHash,
    role,
    firstName,
    lastName,
    username,
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

  // Send verification email via Resend (if configured).
  // Failures here should not block registration.
  try {
    await sendVerificationEmail(email, code)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error while sending verification email', error)
  }

  return {
    ok: true,
    message: 'Registration successful. Check your email for the verification code.',
    // During local development you might want to see the code directly in the response.
    // Remove this in production.
    code: process.env.NODE_ENV !== 'production' ? code : undefined,
  }
}
