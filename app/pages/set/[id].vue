<template>
  <div class="py-20">
    <div class="container max-w-7xl mx-auto p-5">
      <small class="uppercase text-white font-black">set name</small>
      <div v-if="set" class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 class="text-5xl text-secondary font-semibold">{{ set.name }}</h1>
        <div class="flex items-center gap-3">
          <button
            class="px-4 py-2 rounded-md text-sm font-semibold border border-white/40 text-white bg-white/10 hover:bg-white/20 disabled:opacity-60"
            :disabled="collectionLoading"
            @click="toggleCollecting"
          >
            {{ isCollecting ? 'Stop tracking this set' : 'Start tracking this set' }}
          </button>
          <p v-if="isCollecting" class="text-xs text-white/80">
            {{ collectedCount }} / {{ totalCards }} cards collected
          </p>
        </div>
      </div>
    </div>
  </div>
  <div class="bg-white pt-20">
    <div class="container max-w-7xl mx-auto p-5">
      <div
        v-if="set"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <div
          v-for="card in paginatedCards"
          :key="card.id"
          class="border-2 p-5 rounded-lg flex flex-col gap-2"
        >
          <NuxtLink :to="`/card/${card.id}`" class="flex-1">
            <img
              :src="card.images?.small || `${card.image}/low.png`"
              alt=""
              class="mb-2"
            >
            <h2 class="font-bold text-xl">{{ card.name }}</h2>
            <small>
              <strong class="text-secondary">Card No.</strong>
              {{ card.localId ?? card.number }}
            </small>
          </NuxtLink>
          <button
            class="mt-2 px-2 py-1 rounded text-xs font-semibold border"
            :class="
              isCardCollected(card.id)
                ? 'bg-emerald-500 border-emerald-600 text-white'
                : 'bg-white border-gray-300 text-gray-800'
            "
            :disabled="collectionSaving"
            @click="toggleCard(card.id)"
          >
            {{ isCardCollected(card.id) ? 'Collected' : 'Mark as collected' }}
          </button>
        </div>
      </div>

      <div v-if="set" class="mt-4 flex items-center gap-4">
        <button
          class="px-3 py-1 border rounded disabled:opacity-50"
          :disabled="page === 1"
          @click="page--"
        >
          Previous
        </button>

        <span>
          Page {{ page }} of {{ totalPages }}
        </span>

        <button
          class="px-3 py-1 border rounded disabled:opacity-50"
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

const totalCards = computed(() => set.value?.cards.length ?? 0);
const collectedCount = computed(() => collectedCardIds.value.length);
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

const toggleCard = async (cardId: string) => {
  const current = new Set(collectedCardIds.value);
  if (current.has(cardId)) {
    current.delete(cardId);
  } else {
    current.add(cardId);
  }
  collectedCardIds.value = Array.from(current);
  await persistCollection();
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

onMounted(() => {
  const q = route.query.page;
  const raw = Array.isArray(q) ? q[0] : q;
  const parsed = parseInt((raw ?? "") as string, 10);

  if (!Number.isNaN(parsed) && parsed > 0) {
    page.value = parsed;
  }

  // Also load collection state for this set
  loadCollection();
});

const totalPages = computed(() => {
  if (!set.value) return 1;
  return Math.max(1, Math.ceil(set.value.cards.length / pageSize));
});

const paginatedCards = computed(() => {
  if (!set.value) return [];
  const start = (page.value - 1) * pageSize;
  return set.value.cards.slice(start, start + pageSize);
});

watch(page, (newPage) => {
  router.replace({
    query: {
      ...route.query,
      page: newPage.toString(),
    },
  });
});
</script>