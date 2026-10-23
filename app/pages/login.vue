<script setup lang="ts">
const password = ref("");
const error = ref("");
const busy = ref(false);

async function submit() {
  error.value = "";
  busy.value = true;
  try {
    await $fetch("/api/auth/login", { method: "POST", body: { password: password.value } });
    await navigateTo("/");
  } catch (e: any) {
    error.value =
      e?.statusCode === 429 ? "Too many attempts. Try again in 15 minutes." : "Wrong password.";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <UContainer class="flex min-h-screen items-center justify-center">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-lg font-semibold">Login</h1>
      </template>
      <form class="grid gap-3" @submit.prevent="submit">
        <UInput
          v-model="password"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          required
          class="w-full"
        />
        <UButton type="submit" label="Log in" :loading="busy" class="justify-center" />
        <UAlert v-if="error" color="error" variant="subtle" :title="error" />
      </form>
    </UCard>
  </UContainer>
</template>
