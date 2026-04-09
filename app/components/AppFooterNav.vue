<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/95 text-white backdrop-blur lg:hidden"
  >
    <div class="max-w-7xl mx-auto flex items-center justify-around py-3 text-[11px]">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full"
        :class="mobileNavClass(item.to)"
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

const mobileNavClass = (pathPrefix: string) => {
	const isActive = route.path === pathPrefix || route.path.startsWith(`${pathPrefix}/`)
	return isActive ? 'bg-white text-slate-950 font-semibold' : 'text-white/70 hover:bg-white/10'
}
</script>
