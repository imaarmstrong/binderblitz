<template>
  <div class="py-20">
    <div class="container max-w-7xl mx-auto p-5">
      <small class="uppercase text-white font-black">series</small>
      <h1 v-if="series" class="text-5xl text-secondary font-semibold">{{ series.name }}</h1>
    </div>

    <div class="bg-white pt-16">
      <div class="container max-w-7xl mx-auto p-5">
        <div v-if="series" class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <NuxtLink
            v-for="set in series.sets"
            :key="set.id"
            :to="`/set/${set.id}`"
            class="rounded-xl border border-white/10 bg-white/10 backdrop-blur-md shadow-lg p-5 hover:bg-white/15 transition-colors flex flex-col gap-3"
          >
            <div class="flex items-center gap-3">
              <div v-if="set.logo" class="w-16 h-16 flex items-center justify-center bg-white/20 rounded-lg overflow-hidden">
                <img :src="`${set.logo}.png`" :alt="set.name" class="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <h2 class="font-semibold text-lg text-gray-900">{{ set.name }}</h2>
                <p v-if="set.cardCount" class="text-sm text-gray-600">
                  {{ set.cardCount }} cards
                </p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
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
</script>

<style>
</style>