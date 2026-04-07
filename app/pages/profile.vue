<template>
  <div class="container max-w-3xl mx-auto p-5 text-white">
    <h1 class="text-2xl font-semibold mb-4">My profile</h1>

    <div v-if="user" class="space-y-2 bg-white/10 border border-white/10 rounded-xl p-4">
      <p><span class="font-medium">Email:</span> {{ user.email }}</p>
      <p><span class="font-medium">Role:</span> {{ user.role || 'user' }}</p>
      <p>
        <span class="font-medium">Email verified:</span>
        {{ user.emailVerifiedAt ? 'Yes' : 'No' }}
      </p>
      <p v-if="user.createdAt">
        <span class="font-medium">Member since:</span>
        {{ new Date(user.createdAt).toLocaleDateString() }}
      </p>
    </div>

    <p v-else class="text-white/80">You need to be logged in to view your profile.</p>
  </div>
</template>

<script setup lang="ts">
const { user, fetchUser } = useAuthUser()

onMounted(() => {
  if (!user.value) {
    fetchUser()
  }
})
</script>
