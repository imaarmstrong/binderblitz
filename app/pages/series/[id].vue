<template>
  <div class="py-8 md:py-10">
    <div class="container max-w-7xl mx-auto px-5 text-white">
      <section class="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p class="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-2">Series</p>
          <h1 v-if="series" class="text-3xl md:text-4xl font-semibold mb-2">{{ series.name }}</h1>
          <p class="text-sm text-white/70 max-w-xl" v-if="series">
            Browse all sets from this series and track your progress.
          </p>
        </div>
        <div v-if="series" class="flex gap-3 text-xs">
          <div class="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <p class="text-white/60 mb-1">Sets</p>
            <p class="text-lg font-semibold">{{ series.sets.length }}</p>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-2xl px-4 py-3" v-if="totalCards">
            <p class="text-white/60 mb-1">Total cards</p>
            <p class="text-lg font-semibold">{{ totalCards }}</p>
          </div>
        </div>
      </section>

      <section v-if="series" class="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
        <NuxtLink
          v-for="set in series.sets"
          :key="set.id"
          :to="`/set/${set.id}`"
          class="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all shadow-sm hover:shadow-lg p-5 flex flex-col gap-3"
        >
          <div class="flex items-center gap-3">
            <div v-if="set.logo" class="w-16 h-16 flex items-center justify-center bg-white/10 rounded-xl overflow-hidden">
              <img :src="`${set.logo}.png`" :alt="set.name" class="max-h-full max-w-full object-contain" />
            </div>
            <div class="flex-1">
              <h2 class="font-semibold text-base md:text-lg mb-1">{{ set.name }}</h2>
              <p v-if="set.cardCount" class="text-[11px] text-white/70">
                {{ set.cardCount }} cards
              </p>
            </div>
          </div>
        </NuxtLink>
      </section>
      <section v-else class="text-sm text-white/70">
        Loading series…
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import TCGdex from "@tcgdex/sdk";

const route = useRoute();
const id = route.params.id as string;

interface SeriesSet {
  id: string;
  name: string;
  logo?: string;
  cardCount?: number;
}

interface SeriesData {
  id: string;
  name: string;
  sets: SeriesSet[];
}

const { data: series } = await useAsyncData<SeriesData | null>(`series-${id}`, async () => {
  const tcgdex = new TCGdex("en");
  const rawSeries: any = await tcgdex.fetch("series", id);

  const rawSets: any[] = Array.isArray(rawSeries?.sets) ? rawSeries.sets : [];

  const sets: SeriesSet[] = rawSets.map((set: any) => ({
    id: set.id,
    name: set.name,
    logo: set.logo,
    cardCount: set.cardCount?.official ?? set.cardCount ?? undefined,
  }));

  return {
    id: rawSeries.id,
    name: rawSeries.name,
    sets,
  };
});

const totalCards = computed(() =>
	series.value?.sets.reduce((sum, set) => (typeof set.cardCount === 'number' ? sum + set.cardCount : sum), 0) ?? 0,
);
</script>

<style>
</style>