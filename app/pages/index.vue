<script setup lang="ts">
const { data: applications, refresh } = await useFetch<Application[]>(
  "/api/applications",
  { default: () => [] },
);

const statusFilter = ref<Status | "">("");
const visible = computed(() =>
  statusFilter.value
    ? applications.value.filter((a) => a.status === statusFilter.value)
    : applications.value,
);

async function create(payload: Omit<Application, "id">) {
  await $fetch("/api/applications", { method: "POST", body: payload });
  await refresh();
}
async function updateStatus(id: string, status: Status) {
  await $fetch(`/api/applications/${id}`, { method: "PUT", body: { status } });
  await refresh();
}
async function remove(id: string) {
  await $fetch(`/api/applications/${id}`, { method: "DELETE" });
  await refresh();
}
</script>

<template>
  <main>
    <h1>Job applications</h1>
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
