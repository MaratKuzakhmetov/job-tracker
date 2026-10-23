<script setup lang="ts">
const { data: applications, refresh, error: loadError } = await useFetch<Application[]>(
  "/api/applications",
  { default: () => [] },
);

const statusFilter = ref<Status | "">("");
const visible = computed(() =>
  statusFilter.value
    ? applications.value.filter((a) => a.status === statusFilter.value)
    : applications.value,
);

const error = ref("");

// run an action; show a message if it fails, go to login if the session expired
async function run(action: () => Promise<unknown>) {
  error.value = "";
  try {
    await action();
  } catch (e: any) {
    if (e?.statusCode === 401) return navigateTo("/login");
    error.value = "Something went wrong. Please reload the page and try again.";
  }
}

const create = (payload: Omit<Application, "id">) =>
  run(async () => {
    await $fetch("/api/applications", { method: "POST", body: payload });
    await refresh();
  });

const updateStatus = (id: string, status: Status) =>
  run(async () => {
    await $fetch(`/api/applications/${id}`, { method: "PUT", body: { status } });
    await refresh();
  });

const remove = (id: string) =>
  run(async () => {
    await $fetch(`/api/applications/${id}`, { method: "DELETE" });
    await refresh();
  });

const logout = () =>
  run(async () => {
    await $fetch("/api/auth/logout", { method: "POST" });
    await navigateTo("/login");
  });

// the initial list can fail too
watch(
  loadError,
  (e) => {
    if (e?.statusCode === 401) navigateTo("/login");
    else if (e) error.value = "Something went wrong. Please reload the page and try again.";
  },
  { immediate: true },
);
</script>

<template>
  <main>
    <h1>Job applications</h1>
    <button @click="logout">Log out</button>
    <p v-if="error" role="alert">
      {{ error }}
      <button type="button" @click="error = ''">Dismiss</button>
    </p>
    <ApplicationForm @create="create" />
    <label>
      Filter
      <select v-model="statusFilter">
        <option value="">All</option>
        <option v-for="s in STATUSES" :key="s">{{ s }}</option>
      </select>
    </label>
    <ApplicationTable
      :applications="visible"
      @delete="remove"
      @update-status="updateStatus"
    />
  </main>
</template>
