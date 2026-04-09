<template>
  <div class="container max-w-4xl mx-auto p-5 text-white">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-semibold mb-1">Portfolio value</h1>
        <p class="text-sm text-white/70">
          Overview of all sets you're tracking and their estimated market value.
        </p>
      </div>
      <div class="flex items-center gap-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-white/70">Currency</span>
          <select
            v-model="currency"
            class="rounded-md border border-white/30 bg-black/40 px-2 py-1 text-xs"
          >
            <option value="EUR">€ EUR</option>
            <option value="USD">$ USD</option>
            <option value="GBP">£ GBP</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="pending" class="text-sm text-white/70">
      Loading portfolio…
    </div>

    <div v-else-if="!data || !data.sets.length" class="text-sm text-white/70">
      You're not tracking any sets yet. Start by marking cards as collected in a set.
    </div>

    <div v-else class="space-y-5">
      <section class="bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-white/60">Estimated portfolio value</p>
          <p class="text-3xl font-semibold mt-1">
            {{ currencySymbol }}{{ formatAmount(convertFromEUR(data.totals.valueEUR)) }}
          </p>
        </div>
        <div class="text-xs text-white/80 space-y-1">
          <p>
            Sets tracked: <span class="font-semibold">{{ data.totals.setsTracked }}</span>
          </p>
          <p>
            Collected cards: <span class="font-semibold">{{ data.totals.collectedCards }}</span>
          </p>
          <p>
            Priced cards: <span class="font-semibold">{{ data.totals.valuedCards }}</span>
            <span class="text-white/60">(unpriced: {{ data.totals.unvaluedCards }})</span>
          </p>
        </div>
      </section>

      <section class="bg-white/10 border border-white/10 rounded-xl p-4">
        <h2 class="text-lg font-semibold mb-3">Sets</h2>
        <div class="divide-y divide-white/10 text-sm">
          <div
            v-for="set in data.sets"
            :key="set.setId"
            class="py-3 flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3">
              <div
                v-if="set.logo"
                class="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center overflow-hidden"
              >
                <img :src="`${set.logo}.png`" :alt="set.name" class="max-w-full max-h-full object-contain" />
              </div>
              <div>
                <NuxtLink
                  :to="`/set/${set.setId}`"
                  class="font-medium hover:underline"
                >
                  {{ set.name }}
                </NuxtLink>
                <p class="text-xs text-white/70">
                  {{ set.collectedCardCount }} collected
                  <span v-if="set.totalCards">/ {{ set.totalCards }}</span>
                </p>
                <p class="text-[11px] text-white/60">
                  Priced: {{ set.valuedCardCount }} • Unpriced: {{ set.unvaluedCardCount }}
                </p>
              </div>
            </div>
            <div class="text-right text-sm">
              <p class="font-semibold">
                {{ currencySymbol }}{{ formatAmount(convertFromEUR(set.valueEUR)) }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
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

interface PortfolioResponse {
  currency: 'EUR'
  totals: {
    setsTracked: number
    collectedCards: number
    valuedCards: number
    unvaluedCards: number
    valueEUR: number
  }
  sets: PortfolioSetSummary[]
}

const currency = ref<'EUR' | 'USD' | 'GBP'>('EUR')

const { data, pending } = await useAsyncData<PortfolioResponse>('portfolio', () =>
  $fetch<PortfolioResponse>('/api/collection/portfolio'),
)

const rates: Record<'EUR' | 'USD' | 'GBP', number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
}

const currencySymbol = computed(() => {
  if (currency.value === 'USD') return '$'
  if (currency.value === 'GBP') return '£'
  return '€'
})

const convertFromEUR = (amount: number): number => {
  const rate = rates[currency.value] ?? 1
  return amount * rate
}

const formatAmount = (amount: number): string => {
  if (!Number.isFinite(amount)) return '0.00'
  return amount.toFixed(2)
}
</script>
