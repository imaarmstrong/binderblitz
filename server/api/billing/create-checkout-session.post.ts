import { H3Event, sendError, createError, getCookie } from 'h3'
import { ObjectId } from 'mongodb'
import Stripe from 'stripe'
import { useRuntimeConfig } from '#imports'
import { getDb } from '../../utils/mongo'
import { verifyJwt } from '../../utils/auth'

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
  const priceId = config.stripePriceId as string | undefined
  const successUrl = config.stripeSuccessUrl as string | undefined
  const cancelUrl = config.stripeCancelUrl as string | undefined

  if (!secretKey || !priceId || !successUrl || !cancelUrl) {
    return sendError(
      event,
      createError({ statusCode: 500, statusMessage: 'Stripe is not fully configured on the server' }),
    )
  }

  const stripe = new Stripe(secretKey)

  const db = await getDb()
  const users = db.collection('users')

  const userId = new ObjectId(payload.sub)

  const user = await users.findOne({ _id: userId })
  if (!user) {
    return sendError(event, createError({ statusCode: 404, statusMessage: 'User not found' }))
  }

  let stripeCustomerId = (user as any).stripeCustomerId as string | undefined

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: payload.email,
      metadata: {
        appUserId: payload.sub,
      },
    })

    stripeCustomerId = customer.id

    await users.updateOne(
      { _id: userId },
      { $set: { stripeCustomerId } },
    )
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return {
    url: session.url,
  }
}
