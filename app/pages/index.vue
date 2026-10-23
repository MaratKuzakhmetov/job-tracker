<script setup lang="ts">
const { data: applications, refresh, error: loadError } = await useFetch<Application[]>(
  "/api/applications",
  { default: () => [] },
);

const statusFilter = ref<Status | "All">("All");
const visible = computed(() =>
  statusFilter.value !== "All"
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
  <UContainer class="grid gap-6 py-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Job applications</h1>
      <UButton label="Log out" color="neutral" variant="outline" @click="logout" />
    </div>
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="error"
      close
      @update:open="error = ''"
    />
    <ApplicationForm @create="create" />
    <div class="flex items-center gap-2">
      <span class="text-sm">Filter</span>
      <USelect v-model="statusFilter" :items="['All', ...STATUSES]" class="w-40" />
    </div>
    <ApplicationTable
      :applications="visible"
      @delete="remove"
      @update-status="updateStatus"
    />
  </UContainer>
</template>
