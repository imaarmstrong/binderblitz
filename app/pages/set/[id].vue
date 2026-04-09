<template>
  <!-- Hero -->
  <div class="bg-gradient-to-r from-indigo-700 via-purple-700 to-fuchsia-600 py-12 md:py-16 text-white">
    <div class="container max-w-7xl mx-auto px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div>
        <p class="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-2">Set name</p>
        <h1 v-if="set" class="text-4xl md:text-5xl font-semibold leading-tight">
          {{ set.name }}
        </h1>
        <p v-if="set" class="mt-3 text-sm text-white/80">
          {{ collectedCount }} / {{ totalCards }} cards collected
          <span v-if="totalCards">• {{ collectedPercent }}% complete</span>
        </p>
      </div>
      <div v-if="set" class="flex flex-col items-stretch md:items-end gap-3">
        <div class="bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-xs min-w-[220px]">
          <p class="text-white/70 mb-1">Estimated value of collected cards</p>
          <p class="text-lg font-semibold">
            {{ currencySymbol }}{{ formatAmount(convertFromEUR(collectedValueRaw)) }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-[11px]">
          <span class="text-white/70">Currency</span>
          <select
            v-model="currency"
            class="rounded-md border border-white/40 bg-black/20 px-2 py-1 text-xs"
          >
            <option value="EUR">€ EUR</option>
            <option value="USD">$ USD</option>
            <option value="GBP">£ GBP</option>
          </select>
          <span class="text-white/70 ml-2">Grade</span>
          <select
            v-model.number="gradeMultiplier"
            class="rounded-md border border-white/40 bg-black/20 px-2 py-1 text-xs"
          >
            <option :value="1">Raw (1x)</option>
            <option :value="1.5">Mid (~1.5x)</option>
            <option :value="2">High (~2x)</option>
          </select>
          <button
            class="mt-1 md:mt-0 ml-0 md:ml-2 px-3 py-1 rounded-full text-[11px] font-semibold border border-white/40 bg-white/10 hover:bg-white/20 disabled:opacity-60"
            :disabled="collectionLoading"
            @click="toggleCollecting"
          >
            {{ isCollecting ? 'Stop tracking this set' : 'Start tracking this set' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="bg-slate-950 py-8 md:py-10">
    <div class="container max-w-7xl mx-auto px-5 text-white">
      <!-- Controls row -->
      <div
        v-if="set"
        class="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
      >
        <div class="flex items-center gap-2 text-[11px] font-semibold">
          <button
            class="px-4 py-1.5 rounded-full border transition-colors"
            :class="
              filterMode === 'all'
                ? 'bg-white text-slate-950 border-white shadow-sm'
                : 'bg-transparent text-white/80 border-white/40 hover:bg-white/10'
            "
            @click="filterMode = 'all'"
          >
            All
          </button>
          <button
            class="px-4 py-1.5 rounded-full border transition-colors"
            :class="
              filterMode === 'collected'
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-sm'
                : 'bg-transparent text-emerald-200 border-emerald-400/60 hover:bg-emerald-500/10'
            "
            @click="filterMode = 'collected'"
          >
            Collected
          </button>
          <button
            class="px-4 py-1.5 rounded-full border transition-colors"
            :class="
              filterMode === 'uncollected'
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm'
                : 'bg-transparent text-amber-200 border-amber-400/60 hover:bg-amber-500/10'
            "
            @click="filterMode = 'uncollected'"
          >
            To collect
          </button>
        </div>

        <div class="flex-1 max-w-md">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search cards by name or number"
            class="w-full rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <p
        v-if="set"
        class="mb-4 text-[11px] text-white/70"
      >
        Showing
        <span class="font-semibold text-white">{{ visibleCardCount }}</span>
        of
        <span class="font-semibold text-white">{{ totalCards }}</span>
        cards
        <span v-if="filterMode !== 'all'">
          • Filter:
          <span class="font-semibold">{{ filterMode === 'collected' ? 'Collected' : 'To collect' }}</span>
        </span>
        <span v-if="searchQuery">
          • Search:
          <span class="font-semibold">"{{ searchQuery }}"</span>
        </span>
      </p>

      <div
        v-if="set"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6"
      >
        <div
          v-for="card in paginatedCards"
          :key="card.id"
          class="relative rounded-2xl overflow-hidden bg-slate-900/80 border border-white/10 shadow-sm hover:shadow-xl hover:border-white/25 transition-all flex flex-col"
        >
          <div
            v-if="isCardCollected(card.id)"
            class="absolute right-2 top-2 z-10 rounded-full bg-emerald-500 text-[10px] font-semibold px-2 py-0.5 text-slate-950 shadow"
          >
            Collected
          </div>
          <NuxtLink :to="`/card/${card.id}`" class="flex-1">
            <img
              :src="card.images?.small || `${card.image}/low.png`"
              alt=""
              class="w-full mb-3 object-cover"
            >
            <h2 class="font-semibold text-sm md:text-base px-4 text-white">{{ card.name }}</h2>
            <p class="px-4 pb-1 text-[11px] text-white/60">
              <span class="font-semibold text-secondary">Card No.</span>
              {{ card.localId ?? card.number }}
            </p>
          </NuxtLink>
          <div class="px-4 pb-3 space-y-0.5">
            <p
              v-if="cardRawPriceText(card)"
              class="text-[11px] text-white/80"
            >
              ~{{ currencySymbol }}{{ cardRawPriceText(card) }} (raw)
            </p>
            <p
              v-if="cardGradedPriceText(card)"
              class="text-[10px] text-white/60"
            >
              Est. graded: ~{{ currencySymbol }}{{ cardGradedPriceText(card) }}
            </p>
          </div>
          <button
            class="mt-auto mx-4 mb-4 px-3 py-1.5 rounded-full text-[11px] font-semibold border text-center"
            :class="
              isCardCollected(card.id)
                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                : 'bg-transparent border-white/30 text-white hover:bg-white/10'
            "
            :disabled="collectionSaving"
            @click="toggleCard(card.id)"
          >
            {{ isCardCollected(card.id) ? 'Collected' : 'Mark as collected' }}
          </button>
        </div>
      </div>

      <div v-if="set" class="mt-6 flex items-center justify-center gap-3 text-xs text-white/80">
        <button
          class="px-3 py-1.5 rounded-full border border-white/20 bg-white/5 disabled:opacity-40 disabled:bg-transparent"
          :disabled="page === 1"
          @click="page--"
        >
          Previous
        </button>

        <span>
          Page {{ page }} of {{ totalPages }}
        </span>

        <button
          class="px-3 py-1.5 rounded-full border border-white/20 bg-white/5 disabled:opacity-40 disabled:bg-transparent"
          :disabled="page === totalPages"
          @click="page++"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TCGdex from "@tcgdex/sdk";

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const page = ref(1);
const pageSize = 20;

const searchQuery = ref("");
const filterMode = ref<"all" | "collected" | "uncollected">("all");
const gradeMultiplier = ref(1);
const currency = ref<"EUR" | "USD" | "GBP">("EUR");

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

const { data: set } = await useAsyncData(`set-${id}`, async () => {
  const tcgdex = new TCGdex("en");
  const rawSet: any = await tcgdex.set.get(id);

  console.log("Full card data for set", id, rawSet.cards);

  return {
    name: rawSet.name,
    cards: (rawSet.cards ?? []).map((card: any) => cloneCard(card)),
  };
});

// Collection state for this set
const collectionLoading = ref(false);
const collectionSaving = ref(false);
const collectedCardIds = ref<string[]>([]);
const pricedCards = ref<Record<string, number>>({});

const totalCards = computed(() => set.value?.cards.length ?? 0);
const collectedCount = computed(() => collectedCardIds.value.length);
const collectedPercent = computed(() =>
  totalCards.value ? Math.round((collectedCount.value / totalCards.value) * 100) : 0,
);
const isCollecting = computed(() => collectedCardIds.value.length > 0);

const loadCollection = async () => {
  if (!set.value) return;
  collectionLoading.value = true;
  try {
    const { data } = await useFetch(`/api/collection/set/${id}`);
    if (data.value && Array.isArray((data.value as any).collectedCardIds)) {
      collectedCardIds.value = (data.value as any).collectedCardIds;
    }
  } finally {
    collectionLoading.value = false;
  }
};

let tcgdexClient: TCGdex | null = null;

const ensurePriceForCard = async (cardId: string) => {
  if (pricedCards.value[cardId] !== undefined) return;
  try {
    if (!tcgdexClient) {
      tcgdexClient = new TCGdex("en");
    }
    const fullCard: any = await (tcgdexClient as any).fetch("cards", cardId);
    const rawPrice = fullCard?.pricing?.cardmarket?.avg ?? null;
    if (typeof rawPrice === "number" && Number.isFinite(rawPrice) && rawPrice > 0) {
      pricedCards.value = { ...pricedCards.value, [cardId]: rawPrice };
    }
  } catch {
    // ignore pricing errors; card will be treated as unpriced
  }
};

const loadPricesForCollected = async () => {
  const ids = [...collectedCardIds.value];
  if (!ids.length) return;
  await Promise.all(ids.map((id) => ensurePriceForCard(id)));
};

const persistCollection = async () => {
  collectionSaving.value = true;
  try {
    await useFetch(`/api/collection/set/${id}` , {
      method: 'POST',
      body: { collectedCardIds: collectedCardIds.value, totalCards: totalCards.value },
    });
  } finally {
    collectionSaving.value = false;
  }
};

const isCardCollected = (cardId: string) => {
  return collectedCardIds.value.includes(cardId);
};

const cardPrice = (card: any): number | null => {
  const cached = pricedCards.value[card.id as string];
  if (typeof cached === "number" && Number.isFinite(cached) && cached > 0) {
    return cached;
  }

  const price = card?.pricing?.cardmarket?.avg ?? null;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return null;
  return price;
};

const cardRawPriceText = (card: any): string | null => {
  const price = cardPrice(card);
  if (!price) return null;
  return formatAmount(convertFromEUR(price));
};

const cardGradedPriceText = (card: any): string | null => {
  const price = cardPrice(card);
  if (!price) return null;
  const est = price * gradeMultiplier.value;
  return formatAmount(convertFromEUR(est));
};

const toggleCard = async (cardId: string) => {
  const current = new Set(collectedCardIds.value);
  if (current.has(cardId)) {
    current.delete(cardId);
  } else {
    current.add(cardId);
  }
  collectedCardIds.value = Array.from(current);
  await persistCollection();
  if (current.has(cardId)) {
    // Newly collected: try to load its price
    await ensurePriceForCard(cardId);
  }
};

const toggleCollecting = async () => {
  if (collectedCardIds.value.length === 0 && set.value) {
    // Starting tracking with none collected – just create the doc
    await persistCollection();
  } else {
    // Stop tracking: clear all collected cards and persist
    collectedCardIds.value = [];
    await persistCollection();
  }
};

onMounted(async () => {
  const q = route.query.page;
  const raw = Array.isArray(q) ? q[0] : q;
  const parsed = parseInt((raw ?? "") as string, 10);

  if (!Number.isNaN(parsed) && parsed > 0) {
    page.value = parsed;
  }

  // Also load collection state for this set
  await loadCollection();
  await loadPricesForCollected();
});

const filteredCards = computed(() => {
  if (!set.value) return [];
  const q = searchQuery.value.trim().toLowerCase();

  return set.value.cards.filter((card: any) => {
    const name = (card.name ?? "").toString().toLowerCase();
    const number = (card.localId ?? card.number ?? "").toString().toLowerCase();
    const matchesSearch = !q || name.includes(q) || number.includes(q);

    const collected = isCardCollected(card.id as string);
    const matchesFilter =
      filterMode.value === "all" ||
      (filterMode.value === "collected" && collected) ||
      (filterMode.value === "uncollected" && !collected);

    return matchesSearch && matchesFilter;
  });
});

watch([searchQuery, filterMode], () => {
  page.value = 1;
});

const totalPages = computed(() => {
  if (!set.value) return 1;
  const count = filteredCards.value.length;
  return Math.max(1, Math.ceil(count / pageSize));
});

const paginatedCards = computed(() => {
  if (!set.value) return [];
  const cards = filteredCards.value;
  const start = (page.value - 1) * pageSize;
  return cards.slice(start, start + pageSize);
});

const collectedValueRaw = computed(() => {
  if (!set.value) return 0;
  return set.value.cards.reduce((sum: number, card: any) => {
    if (!isCardCollected(card.id as string)) return sum;
    const price = cardPrice(card);
    return price ? sum + price : sum;
  }, 0);
});

const visibleCardCount = computed(() => filteredCards.value.length);
// Base pricing is EUR (Cardmarket), totals are maintained in EUR and
// converted to the display currency when rendered.
const rates: Record<"EUR" | "USD" | "GBP", number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
};

const currencySymbol = computed(() => {
  if (currency.value === "USD") return "$";
  if (currency.value === "GBP") return "£";
  return "€";
});

const convertFromEUR = (amount: number): number => {
  const rate = rates[currency.value] ?? 1;
  return amount * rate;
};

const formatAmount = (amount: number): string => {
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toFixed(2);
};

watch(page, (newPage) => {
  router.replace({
    query: {
      ...route.query,
      page: newPage.toString(),
    },
  });
});
</script>