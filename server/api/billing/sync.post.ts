import { H3Event, sendError, createError, getCookie } from 'h3'
import Stripe from 'stripe'
import { useRuntimeConfig } from '#imports'
import { getDb } from '../../utils/mongo'
import { verifyJwt } from '../../utils/auth'
import { ObjectId } from 'mongodb'

export default async function (event: H3Event) {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    return sendError(event, createError({ statusCode: 401, statusMessage: 'Not authenticated' }))
  }

  const payload = verifyJwt<{ sub: string; email: string }>(token)
  if (!payload) {
    return sendError(event, createError({ statusCode: 401, statusMessage: 'Invalid token' }))
  }

  const config = useRuntimeConfig() as any
  const secretKey = config.stripeSecretKey as string | undefined

  if (!secretKey) {
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Stripe is not configured' }))
  }

  const stripe = new Stripe(secretKey)
  const db = await getDb()
  const users = db.collection('users')

  const userId = new ObjectId(payload.sub)
  const user = await users.findOne({ _id: userId })
  if (!user) {
    return sendError(event, createError({ statusCode: 404, statusMessage: 'User not found' }))
  }

  const stripeCustomerId = (user as any).stripeCustomerId as string | undefined
  if (!stripeCustomerId) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'No Stripe customer on this user' }))
  }

  const subs = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'all',
    expand: ['data.default_payment_method'],
    limit: 1,
  })

  const sub = subs.data[0]

  if (!sub) {
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          subscriptionStatus: 'canceled',
          subscriptionCurrentPeriodEnd: null,
          subscriptionActive: false,
        },
      },
    )

    return {
      subscriptionActive: false,
      subscriptionStatus: 'canceled',
      subscriptionCurrentPeriodEnd: null,
    }
  }

  const status = sub.status
  const currentPeriodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000)
    : null
  const isActive = status === 'active' || status === 'trialing'

  await users.updateOne(
    { _id: userId },
    {
      $set: {
        subscriptionStatus: status,
        subscriptionCurrentPeriodEnd: currentPeriodEnd,
        subscriptionActive: isActive,
      },
    },
  )

  return {
    subscriptionActive: isActive,
    subscriptionStatus: status,
    subscriptionCurrentPeriodEnd: currentPeriodEnd,
  }
}
