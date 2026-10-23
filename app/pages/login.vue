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
  <main>
    <h1>Login</h1>
    <form @submit.prevent="submit">
      <input v-model="password" type="password" placeholder="Password" autocomplete="current-password" required />
      <button :disabled="busy">Log in</button>
      <p v-if="error">{{ error }}</p>
    </form>
  </main>
</template>
