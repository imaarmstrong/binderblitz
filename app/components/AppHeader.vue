<template>
  <header class="bg-primary/95 backdrop-blur border-b border-white/10">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-4 py-4 px-4">
      <NuxtLink to="/" class="flex items-center gap-3">
        <img src="/logo.svg" alt="BinderBlitz logo" class="h-10 w-auto" />
      </NuxtLink>

      <nav class="hidden md:flex items-center gap-4 text-white text-sm">
        <template v-if="user">
          <NuxtLink
            to="/"
            class="hover:text-white/90"
            :class="route.path === '/' ? 'font-semibold' : 'text-white/80'"
          >
            Browse
          </NuxtLink>
          <NuxtLink
            to="/collections"
            class="hover:text-white/90"
            :class="route.path.startsWith('/collections') ? 'font-semibold' : 'text-white/80'"
          >
            Collections
          </NuxtLink>
          <NuxtLink
            to="/friends"
            class="hover:text-white/90"
            :class="route.path.startsWith('/friends') ? 'font-semibold' : 'text-white/80'"
          >
            Friends
          </NuxtLink>
          <NuxtLink
            to="/profile"
            class="hover:text-white/90"
            :class="route.path.startsWith('/profile') ? 'font-semibold' : 'text-white/80'"
          >
            Profile
          </NuxtLink>
          <NuxtLink
            to="/subscribe"
            class="px-3 py-1 rounded-md border border-emerald-400 text-emerald-200 hover:bg-emerald-500/10 text-xs"
            :class="user.subscriptionActive ? 'opacity-60 cursor-default' : ''"
          >
            {{ user.subscriptionActive ? 'Subscribed' : 'Upgrade' }}
          </NuxtLink>
          <button
            type="button"
            class="px-3 py-1 rounded-md border border-white/40 hover:bg-white/10 text-xs"
            @click="handleLogout"
          >
            Logout
          </button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="hover:text-white/90 text-white/80">
            Log in
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="px-3 py-1 rounded-md border border-white/40 hover:bg-white/10 text-xs"
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
</script>

<style>

</style>