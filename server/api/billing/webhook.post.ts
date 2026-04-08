import { H3Event, sendError, createError, getHeader, readRawBody } from 'h3'
import Stripe from 'stripe'
import { useRuntimeConfig } from '#imports'
import { getDb } from '../../utils/mongo'

export default async function (event: H3Event) {
  const config = useRuntimeConfig() as any
  const secretKey = config.stripeSecretKey as string | undefined
  const webhookSecret = config.stripeWebhookSecret as string | undefined

  if (!secretKey || !webhookSecret) {
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Stripe webhook not configured' }))
  }

  const stripe = new Stripe(secretKey)

  const signature = getHeader(event, 'stripe-signature')
  if (!signature) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Missing Stripe signature header' }))
  }

  const rawBody = await readRawBody(event)
  if (!rawBody) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Empty request body' }))
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    return sendError(event, createError({ statusCode: 400, statusMessage: `Webhook error: ${err.message}` }))
  }

  const db = await getDb()
  const users = db.collection('users')

  if (
    stripeEvent.type === 'customer.subscription.created' ||
    stripeEvent.type === 'customer.subscription.updated' ||
    stripeEvent.type === 'customer.subscription.deleted'
  ) {
    const subscription = stripeEvent.data.object as Stripe.Subscription
    const customerId = subscription.customer as string
    const status = subscription.status
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null

    const isActive = status === 'active' || status === 'trialing'

    await users.updateOne(
      { stripeCustomerId: customerId },
      {
        $set: {
          subscriptionStatus: status,
          subscriptionCurrentPeriodEnd: currentPeriodEnd,
          subscriptionActive: isActive,
        },
      },
    )
  }

  return {
    received: true,
  }
}
