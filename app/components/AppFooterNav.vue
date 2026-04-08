<template>
  <nav
	class="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/80 text-white backdrop-blur lg:hidden"
  >
    <div class="max-w-7xl mx-auto flex items-stretch justify-around py-8 text-xs">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md"
          :class="
            route.path === item.to
              ? 'text-white font-semibold'
              : 'text-white/70'
          "
        >
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()

const items = [
  { to: '/', label: 'Browse' },
  { to: '/collections', label: 'My Collections' },
  { to: '/friends', label: 'Friends' },
  { to: '/profile', label: 'Profile' },
]
</script>
