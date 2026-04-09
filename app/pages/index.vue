<template>
  <div class="py-8 md:py-10">
    <div class="container max-w-7xl mx-auto px-5">
      <section class="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p class="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-2">Browse sets</p>
          <h1 class="text-3xl md:text-4xl font-semibold text-white mb-2">
            Build your dream Pokémon binder
          </h1>
          <p class="text-sm text-white/70 max-w-xl">
            Explore every series, track what you own, and see the value of your collection update as you add cards.
          </p>
        </div>
        <div class="flex gap-3 text-xs">
          <div class="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <p class="text-white/60 mb-1">Series</p>
            <p class="text-lg font-semibold">{{ sets.length }}</p>
          </div>
        </div>
      </section>

      <section class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <NuxtLink
          v-for="set in sets"
          :key="set.id"
          :to="`/series/${set.id}`"
          class="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all shadow-sm hover:shadow-lg overflow-hidden flex flex-col items-center text-center px-6 py-8 text-white"
        >
          <div class="h-20 flex items-center justify-center mb-4 w-full">
            <img
              v-if="set.logo"
              :src="`${set.logo}.png`"
              :alt="set.name"
              class="max-h-full w-auto mx-auto"
            />
          </div>
          <h2 class="text-lg font-semibold mb-1">{{ set.name }}</h2>
          <p class="text-xs text-white/70">Tap to view all sets in this series.</p>
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import TCGdex from "@tcgdex/sdk";

const tcgdex = new TCGdex('en');

// Note: Top-level await requires a Suspense component in the parent
// or an async setup environment.
const sets = await tcgdex.fetch('series');
</script>