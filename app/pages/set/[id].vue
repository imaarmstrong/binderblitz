<template>
  <div class="py-20">
    <div class="container max-w-7xl mx-auto p-5">
      <small class="uppercase text-white font-black">set name</small>
      <h1 v-if="set" class="text-5xl text-secondary font-semibold">{{ set.name }}</h1>
    </div>
  </div>
  <div class="bg-white pt-20">
    <div class="container max-w-7xl mx-auto p-5">
      <div
        v-if="set"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <div v-for="card in paginatedCards" :key="card.id" class="border-2 p-5 rounded-lg">
          <NuxtLink :to="`/card/${card.id}`">
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

onMounted(() => {
  const q = route.query.page;
  const raw = Array.isArray(q) ? q[0] : q;
  const parsed = parseInt((raw ?? "") as string, 10);

  if (!Number.isNaN(parsed) && parsed > 0) {
    page.value = parsed;
  }
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