import { H3Event, sendError, createError, getCookie } from 'h3'
import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/mongo'
import { verifyJwt } from '../../utils/auth'
import TCGdex from '@tcgdex/sdk'

interface PortfolioSetSummary {
  setId: string
  name: string
  logo?: string
  totalCards: number | null
  collectedCardCount: number
  valuedCardCount: number
  unvaluedCardCount: number
  valueEUR: number
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

  const db = await getDb()
  const collections = db.collection('setCollections')

  const userId = new ObjectId(payload.sub)

  const docs = await collections.find({ userId }).toArray()

  if (!docs.length) {
    return {
      currency: 'EUR',
      totals: {
        setsTracked: 0,
        collectedCards: 0,
        valuedCards: 0,
        unvaluedCards: 0,
        valueEUR: 0,
      },
      sets: [] as PortfolioSetSummary[],
    }
  }

  const tcgdex = new TCGdex('en')

  const sets: PortfolioSetSummary[] = []

  for (const doc of docs) {
    const setId = (doc as any).setId as string
    let name = setId
    let logo: string | undefined
    let totalCards: number | null =
      typeof (doc as any).totalCards === 'number' ? ((doc as any).totalCards as number) : null

    let cards: any[] = []

    try {
      const rawSet: any = await (tcgdex as any).set.get(setId)
      name = rawSet.name ?? setId
      logo = rawSet.logo
      cards = Array.isArray(rawSet.cards) ? rawSet.cards : []
      if (totalCards === null) {
        totalCards = Array.isArray(rawSet.cards)
          ? rawSet.cards.length
          : typeof rawSet.cardCount?.official === 'number'
            ? rawSet.cardCount.official
            : typeof rawSet.cardCount === 'number'
              ? rawSet.cardCount
              : null
      }
    } catch {
      // ignore metadata errors; still compute what we can
    }

    const collectedCardIds = ((doc as any).collectedCardIds as string[]) ?? []

    if (!collectedCardIds.length) {
      sets.push({
        setId,
        name,
        logo,
        totalCards,
        collectedCardCount: 0,
        valuedCardCount: 0,
        unvaluedCardCount: 0,
        valueEUR: 0,
      })
      continue
    }

    let valueEUR = 0
    let valuedCardCount = 0
    let unvaluedCardCount = 0

    for (const cardId of collectedCardIds) {
      let price: number | null = null

      // Try from set payload first if available
      const fromSet = cards.find((c) => (c as any).id === cardId)
      if (fromSet) {
        price = extractCardPriceEUR(fromSet)
      }

      // If no price on the set payload, fall back to fetching
      // the individual card, which usually contains pricing
      if (price === null) {
        try {
          const fullCard: any = await (tcgdex as any).fetch('cards', cardId)
          price = extractCardPriceEUR(fullCard)
        } catch {
          // ignore individual card fetch errors; treat as unpriced
        }
      }

      if (price !== null) {
        valueEUR += price
        valuedCardCount += 1
      } else {
        unvaluedCardCount += 1
      }
    }

    sets.push({
      setId,
      name,
      logo,
      totalCards,
      collectedCardCount: collectedCardIds.length,
      valuedCardCount,
      unvaluedCardCount,
      valueEUR,
    })
  }

  const totals = sets.reduce(
    (acc, set) => {
      acc.setsTracked += 1
      acc.collectedCards += set.collectedCardCount
      acc.valuedCards += set.valuedCardCount
      acc.unvaluedCards += set.unvaluedCardCount
      acc.valueEUR += set.valueEUR
      return acc
    },
    {
      setsTracked: 0,
      collectedCards: 0,
      valuedCards: 0,
      unvaluedCards: 0,
      valueEUR: 0,
    },
  )

  return {
    currency: 'EUR',
    totals,
    sets,
  }
}

function extractCardPriceEUR(card: any): number | null {
  // Prefer Cardmarket (EUR) pricing
  const cmAvg = card?.pricing?.cardmarket?.avg
  if (typeof cmAvg === 'number' && Number.isFinite(cmAvg) && cmAvg > 0) {
    return cmAvg
  }

  // Fallback: tcgplayer (assumed USD) converted approximately to EUR
  const tpAvg = card?.pricing?.tcgplayer?.avg
  if (typeof tpAvg === 'number' && Number.isFinite(tpAvg) && tpAvg > 0) {
    const usdToEur = 0.92
    return tpAvg * usdToEur
  }

  return null
}
