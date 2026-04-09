<template>
  <div class="py-8 md:py-10">
    <div class="container max-w-7xl mx-auto px-5 text-white">
      <section class="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p class="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-2">My collections</p>
          <h1 class="text-3xl md:text-4xl font-semibold mb-1">Tracked sets</h1>
          <p class="text-sm text-white/70 max-w-xl">
            See how close you are to completing each set you're tracking.
          </p>
        </div>
        <div v-if="items.length" class="flex gap-3 text-xs">
          <div class="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <p class="text-white/60 mb-1">Cards collected</p>
            <p class="text-lg font-semibold">{{ totalCollected }}</p>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <p class="text-white/60 mb-1">Completion</p>
            <p class="text-lg font-semibold">{{ totalPercentage.toFixed(1) }}%</p>
          </div>
        </div>
      </section>

      <div v-if="!items.length" class="text-white/75 text-sm bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
        You haven't started tracking any sets yet. Open a set and start marking cards as collected to see your progress here.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        <NuxtLink
          v-for="item in items"
          :key="item.setId"
          :to="`/set/${item.setId}`"
          class="group rounded-2xl border border-white/8 bg-white/5 hover:bg-white/10 transition-all shadow-sm hover:shadow-lg p-5 flex flex-col gap-3"
        >
          <div class="flex items-center gap-3">
            <div v-if="item.logo" class="w-14 h-14 flex items-center justify-center bg-white/10 rounded-xl overflow-hidden">
              <img :src="`${item.logo}.png`" :alt="item.name" class="max-h-full max-w-full object-contain" />
            </div>
            <div class="flex-1">
              <h2 class="font-semibold text-base md:text-lg mb-1">{{ item.name }}</h2>
              <p class="text-[11px] text-white/70">
                {{ item.collectedCardCount }} / {{ item.totalCards ?? '?' }} cards collected
                <span v-if="item.totalCards" class="ml-1">
                  ({{ itemPercentage(item).toFixed(1) }}%)
                </span>
              </p>
              <div class="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden" v-if="item.totalCards">
                <div
                  class="h-full rounded-full bg-emerald-400"
                  :style="{ width: `${itemPercentage(item)}%` }"
                />
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CollectionItem {
  setId: string
  name: string
  logo?: string
  totalCards: number | null
  collectedCardCount: number
}

const { data } = await useFetch<{ items: CollectionItem[] }>("/api/collection/sets")

const items = computed(() => data.value?.items ?? [])

const totalCards = computed(() =>
  items.value.reduce((sum, item) => (typeof item.totalCards === 'number' ? sum + item.totalCards : sum), 0),
)

const totalCollected = computed(() =>
  items.value.reduce((sum, item) => sum + item.collectedCardCount, 0),
)

const totalPercentage = computed(() => {
  if (!totalCards.value) return 0
  return (totalCollected.value / totalCards.value) * 100
})

const itemPercentage = (item: CollectionItem) => {
  if (!item.totalCards) return 0
  return (item.collectedCardCount / item.totalCards) * 100
}
</script>
