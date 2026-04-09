<template>
  <div class="min-h-screen bg-slate-950">
    <div class="container max-w-6xl mx-auto px-5 py-6 md:py-10">
      <NuxtLink
        class="inline-flex items-center text-xs font-semibold text-white/80 hover:text-white mb-6"
        @click.prevent="$router.back()"
      >
        <span class="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
          ←
        </span>
        Back to set
      </NuxtLink>

      <div
        v-if="card"
        class="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] items-start"
      >
        <!-- Card art -->
        <div class="bg-slate-900/70 rounded-3xl p-5 md:p-6 shadow-2xl border border-white/10">
          <div class="bg-slate-900/60 rounded-2xl overflow-hidden flex items-center justify-center mb-4">
            <img :src="`${card.image}/high.png`" :alt="card.name" class="max-h-[520px] w-auto">
          </div>
          <p v-if="card.set" class="text-xs text-white/70">
            From set
            <NuxtLink
              v-if="card.set.id"
              :to="`/set/${card.set.id}`"
              class="font-semibold text-emerald-300 hover:text-emerald-200"
            >
              {{ card.set.name || card.set.id }}
            </NuxtLink>
            <span v-else class="font-semibold">{{ card.set.name }}</span>
          </p>
          <p v-if="card.localId || card.number" class="text-xs text-white/60 mt-1">
            Card no.
            <span class="font-semibold text-white">{{ card.localId ?? card.number }}</span>
          </p>
        </div>

        <!-- Details -->
        <div class="space-y-6">
          <div>
            <h1 class="text-3xl md:text-4xl font-semibold text-white mb-3">
              {{ card.name }}
            </h1>
            <div class="flex flex-wrap gap-2 text-[11px]">
              <span
                v-if="card.rarity"
                class="inline-flex items-center rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 px-3 py-1"
              >
                Rarity: {{ card.rarity }}
              </span>
              <span
                v-if="card.types?.length"
                class="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/40 px-3 py-1"
              >
                Types: {{ card.types.join(', ') }}
              </span>
              <span
                v-if="card.hp"
                class="inline-flex items-center rounded-full bg-sky-500/15 text-sky-200 border border-sky-400/40 px-3 py-1"
              >
                HP {{ card.hp }}
              </span>
              <span
                v-if="card.illustrator"
                class="inline-flex items-center rounded-full bg-white/5 text-white/80 border border-white/10 px-3 py-1"
              >
                Illustrator: {{ card.illustrator }}
              </span>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="bg-slate-900/70 rounded-2xl p-4 border border-white/10">
              <h2 class="text-xs font-semibold text-white/60 mb-2 uppercase tracking-[0.16em]">
                Card details
              </h2>
              <dl class="space-y-1.5 text-xs text-white/80">
                <div v-if="card.regulationMark" class="flex justify-between gap-4">
                  <dt class="text-white/60">Regulation mark</dt>
                  <dd class="font-semibold">{{ card.regulationMark }}</dd>
                </div>
                <div v-if="card.stage" class="flex justify-between gap-4">
                  <dt class="text-white/60">Stage</dt>
                  <dd class="font-semibold">{{ card.stage }}</dd>
                </div>
                <div v-if="card.weaknesses?.length" class="flex justify-between gap-4">
                  <dt class="text-white/60">Weaknesses</dt>
                  <dd class="font-semibold">
                    {{ card.weaknesses.map(w => `${w.type} ×${w.value}`).join(', ') }}
                  </dd>
                </div>
                <div v-if="card.resistances?.length" class="flex justify-between gap-4">
                  <dt class="text-white/60">Resistances</dt>
                  <dd class="font-semibold">
                    {{ card.resistances.map(r => `${r.type} −${r.value}`).join(', ') }}
                  </dd>
                </div>
                <div v-if="card.retreatCost?.length" class="flex justify-between gap-4">
                  <dt class="text-white/60">Retreat cost</dt>
                  <dd class="font-semibold">
                    {{ card.retreatCost.join(' • ') }}
                  </dd>
                </div>
              </dl>
            </div>

            <div class="bg-slate-900/70 rounded-2xl p-4 border border-emerald-500/30">
              <h2 class="text-xs font-semibold text-emerald-200 mb-2 uppercase tracking-[0.16em]">
                Market snapshot
              </h2>
              <p v-if="cardPriceEUR !== null" class="text-sm text-white mb-1">
                Avg raw price:
                <span class="font-semibold">€{{ formatAmount(cardPriceEUR) }}</span>
              </p>
              <p v-else class="text-sm text-white/70">
                No market pricing available for this card.
              </p>
              <p v-if="cardPriceEUR !== null" class="text-[11px] text-white/60">
                ≈ ${{ formatAmount(cardPriceEUR * usdRate) }}
                • £{{ formatAmount(cardPriceEUR * gbpRate) }}
              </p>
            </div>
          </div>

          <div v-if="card.abilities?.length" class="bg-slate-900/70 rounded-2xl p-4 border border-purple-500/30">
            <h2 class="text-xs font-semibold text-purple-200 mb-3 uppercase tracking-[0.16em]">
              Abilities
            </h2>
            <div
              v-for="ability in card.abilities"
              :key="ability.name"
              class="mb-3 last:mb-0"
            >
              <p class="text-sm font-semibold text-white">{{ ability.name }}</p>
              <p class="text-xs text-white/70" v-if="ability.text">
                {{ ability.text }}
              </p>
            </div>
          </div>

          <div v-if="card.attacks?.length" class="bg-slate-900/70 rounded-2xl p-4 border border-sky-500/30">
            <h2 class="text-xs font-semibold text-sky-200 mb-3 uppercase tracking-[0.16em]">
              Attacks
            </h2>
            <div
              v-for="attack in card.attacks"
              :key="attack.name"
              class="mb-4 last:mb-0 border-b border-white/5 pb-3 last:border-0 last:pb-0"
            >
              <div class="flex items-center justify-between gap-3 mb-1">
                <p class="text-sm font-semibold text-white">
                  {{ attack.name }}
                </p>
                <p v-if="attack.damage" class="text-xs font-semibold text-white/80">
                  {{ attack.damage }}
                </p>
              </div>
              <p v-if="attack.cost?.length" class="text-[11px] text-white/60 mb-1">
                Cost: {{ attack.cost.join(' • ') }}
              </p>
              <p v-if="attack.text" class="text-xs text-white/70">
                {{ attack.text }}
              </p>
            </div>
          </div>

          <div v-if="displayVariants.length" class="bg-slate-900/70 rounded-2xl p-4 border border-white/10">
            <h2 class="text-xs font-semibold text-white/70 mb-2 uppercase tracking-[0.16em]">
              Print variants
            </h2>
            <div class="flex flex-wrap gap-2 text-xs text-white/80">
              <span
                v-for="variant in displayVariants"
                :key="`variant-${variant}`"
                class="inline-flex rounded-full bg-white/5 px-3 py-1 border border-white/10"
              >
                {{ variant }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex items-center justify-center py-24 text-sm text-white/70"
      >
        Loading card…
      </div>
    </div>
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

  // Return a JSON-safe clone so all info is available without circular refs
  return cloneCard(rawCard);
});

const usdRate = 1.1;
const gbpRate = 0.85;

const cardPriceEUR = computed<number | null>(() => {
  const pricing = (card.value as any)?.pricing;
  if (!pricing) return null;

  const candidate =
    typeof pricing.cardmarket?.avg === "number"
      ? pricing.cardmarket.avg
      : typeof pricing.tcgplayer?.avg === "number"
        ? pricing.tcgplayer.avg
        : null;

  return typeof candidate === "number" ? candidate : null;
});

function formatAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
}

const displayVariants = computed<string[]>(() => {
  const variants = (card.value as any)?.variants;
  if (!variants || typeof variants !== "object") return [];

  return Object.entries(variants)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key);
});
</script>