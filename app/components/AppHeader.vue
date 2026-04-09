<template>
  <header class="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-4 py-3 px-4">
      <NuxtLink to="/" class="flex items-center gap-2">
        <img src="/logo.svg" alt="BinderBlitz logo" class="h-8 w-auto" />
        <span class="hidden sm:inline text-sm font-semibold tracking-wide text-white/90">
          BinderBlitz
        </span>
      </NuxtLink>

      <nav class="hidden md:flex items-center gap-2 text-xs">
        <template v-if="user">
          <NuxtLink
            to="/"
            class="px-3 py-1.5 rounded-full transition-colors"
            :class="navClass('/')"
          >
            Browse
          </NuxtLink>
          <NuxtLink
            to="/collections"
            class="px-3 py-1.5 rounded-full transition-colors"
            :class="navClass('/collections')"
          >
            Collections
          </NuxtLink>
          <NuxtLink
            to="/portfolio"
            class="px-3 py-1.5 rounded-full transition-colors"
            :class="navClass('/portfolio')"
          >
            Portfolio
          </NuxtLink>
          <NuxtLink
            to="/friends"
            class="px-3 py-1.5 rounded-full transition-colors"
            :class="navClass('/friends')"
          >
            Friends
          </NuxtLink>
          <NuxtLink
            to="/profile"
            class="px-3 py-1.5 rounded-full transition-colors"
            :class="navClass('/profile')"
          >
            Profile
          </NuxtLink>
          <NuxtLink
            to="/subscribe"
            class="ml-2 px-3 py-1.5 rounded-full border text-xs"
            :class="user.subscriptionActive ? 'border-emerald-500/40 text-emerald-200/70 cursor-default opacity-70' : 'border-emerald-500/60 text-emerald-200 hover:bg-emerald-500/10'"
          >
            {{ user.subscriptionActive ? 'Subscribed' : 'Upgrade' }}
          </NuxtLink>
          <button
            type="button"
            class="ml-1 px-3 py-1.5 rounded-full border border-white/30 text-xs text-white/80 hover:bg-white/10"
            @click="handleLogout"
          >
            Logout
          </button>
        </template>
        <template v-else>
          <NuxtLink
            to="/login"
            class="px-3 py-1.5 rounded-full text-xs text-white/80 hover:bg-white/10"
          >
            Log in
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="px-3 py-1.5 rounded-full border border-white/30 text-xs hover:bg-white/10"
          >
            Sign up
          </NuxtLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const { user, fetchUser, logout } = useAuthUser()
const route = useRoute()

onMounted(() => {
  // Try to hydrate auth state when the header mounts
  fetchUser()
})

const handleLogout = async () => {
  await logout()
}

const navClass = (pathPrefix: string) => {
  const isActive = route.path === pathPrefix || route.path.startsWith(`${pathPrefix}/`)
  return isActive ? 'bg-white text-slate-950 font-semibold' : 'text-white/70 hover:bg-white/10'
}
</script>

<style>

</style>