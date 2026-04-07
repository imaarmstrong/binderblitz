<template>
  <div class="container max-w-7xl mx-auto p-5">
    <div class="grid grid-cols-3 gap-5">
      <div
        v-for="set in sets"
        :key="set.id"
        class="rounded-xl border text-center border-white/10 bg-white/10 backdrop-blur-md shadow-lg p-10 hover:bg-white/15 transition-colors text-white"
      >
        <nuxt-link :to="`/series/${set.id}`">
          <img
              v-if="set.logo"
              :src="`${set.logo}.png`"
              :alt="set.name"
              class="w-auto max-h-20 mb-4 mx-auto"
          />
          <h2 class="text-xl font-semibold">{{ set.name }}</h2>
        </nuxt-link>
      </div>
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