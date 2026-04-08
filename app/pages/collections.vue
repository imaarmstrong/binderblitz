<template>
  <div class="py-20">
    <div class="container max-w-7xl mx-auto p-5 text-white">
      <h1 class="text-3xl font-semibold mb-4">My collections</h1>

      <div v-if="items.length" class="mb-6 text-sm text-white/80">
        <p>
          Total collected: <span class="font-semibold">{{ totalCollected }}</span>
          of
          <span class="font-semibold">{{ totalCards }}</span>
          cards ({{ totalPercentage.toFixed(1) }}%)
        </p>
      </div>

      <div v-if="!items.length" class="text-white/80">
        You haven't started tracking any sets yet. Visit a set page to mark cards as collected.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        <NuxtLink
          v-for="item in items"
          :key="item.setId"
          :to="`/set/${item.setId}`"
          class="rounded-xl border border-white/10 bg-white/10 backdrop-blur-md shadow-lg p-5 hover:bg-white/15 transition-colors flex flex-col gap-3"
        >
          <div class="flex items-center gap-3">
            <div v-if="item.logo" class="w-14 h-14 flex items-center justify-center bg-white/20 rounded-lg overflow-hidden">
              <img :src="`${item.logo}.png`" :alt="item.name" class="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <h2 class="font-semibold text-lg">{{ item.name }}</h2>
              <p class="text-xs text-white/70">
                {{ item.collectedCardCount }} / {{ item.totalCards ?? '?' }} cards collected
                <span v-if="item.totalCards" class="ml-1">
                  ({{ itemPercentage(item).toFixed(1) }}%)
                </span>
              </p>
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
