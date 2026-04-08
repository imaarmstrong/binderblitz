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
  const portalReturnUrl = (config.stripePortalReturnUrl as string | undefined) || (config.stripeSuccessUrl as string | undefined)

  if (!secretKey || !portalReturnUrl) {
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Stripe portal is not configured' }))
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

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: portalReturnUrl,
  })

  return { url: session.url }
}
