<template>
  <header class="bg-primary py-7 px-[3vw] flex items-center justify-between">
    <NuxtLink to="/" class="flex items-center gap-3">
      <img src="/logo.svg" alt="BinderBlitz logo" class="h-14 w-auto" />
    </NuxtLink>

    <nav class="flex items-center gap-4 text-white">
      <template v-if="user">
        <NuxtLink to="/profile" class="hover:underline">
          My profile
        </NuxtLink>
        <NuxtLink to="/settings" class="hover:underline">
          Settings
        </NuxtLink>
        <button
          type="button"
          class="px-3 py-1 rounded-md border border-white/40 hover:bg-white/10 text-sm"
          @click="handleLogout"
        >
          Logout
        </button>
      </template>
      <template v-else>
        <NuxtLink to="/login" class="hover:underline">
          Log in
        </NuxtLink>
        <NuxtLink
          to="/register"
          class="px-3 py-1 rounded-md border border-white/40 hover:bg-white/10 text-sm"
        >
          Sign up
        </NuxtLink>
      </template>
    </nav>
  </header>
</template>

<script setup lang="ts">
const { user, fetchUser, logout } = useAuthUser()

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