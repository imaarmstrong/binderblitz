<template>
  <div v-if="card" class="bg-white">
    <div class="container max-w-7xl mx-auto p-5">
      <div class="mb-5">
        <NuxtLink 
          v-on:click="`${$router.back()}`"
          class="bg-primary px-3 py-2 block w-fit rounded-full text-white uppercase tracking-wider cursor-pointer font-bold"
        >
          Back
        </NuxtLink>
      </div>
      <div class="grid grid-cols-3 gap-20">
        <div class="col-span-1">
          <img :src="`${card.image}/high.png`" alt="" class="shadow-2xl">
        </div>
        <div class="col-span-2">
          <h1 class="text-4xl text-black font-bold">{{ card.name }}</h1>
          <p v-if="card.rarity">Rarity: {{ card.rarity }}</p>
          <p v-if="card.pricing?.cardmarket?.avg !== undefined">
            Avg Price (EUR): {{ card.pricing.cardmarket.avg }}
          </p>
          <div v-if="displayVariants.length" class="mt-4">
            <h2 class="font-semibold mb-2">Variants</h2>
            <div
              class="flex flex-grow"
              v-for="variant in displayVariants"
              :key="`variant-${variant}`"
            >
              <div>
                <h3>{{ variant }}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    Loading card...
  </div>
</template>

<script setup lang="ts">
import TCGdex from "@tcgdex/sdk";

const route = useRoute();
const id = route.params.id as string;

function cloneCard(value: any): any {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(cloneCard);

  const plain: any = {};
  for (const [key, val] of Object.entries(value)) {
    if (key === "tcgdex" || key === "endpoint") continue;
    if (typeof val === "function") continue;
    plain[key] = cloneCard(val);
  }
  return plain;
}

const { data: card } = await useAsyncData(`card-${id}`, async () => {
  const tcgdex = new TCGdex("en");

  const rawCard: any = await tcgdex.fetch("cards", id);

  console.log(JSON.stringify(rawCard, null, 2));

  // Return a JSON-safe clone so all info is available without circular refs
  return cloneCard(rawCard);
});

const displayVariants = computed<string[]>(() => {
  const variants = (card.value as any)?.variants;
  if (!variants || typeof variants !== "object") return [];

  return Object.entries(variants)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key);
});
</script>