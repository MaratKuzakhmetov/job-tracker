<script setup lang="ts">
import Fuse from "fuse.js";

const { data: applications, refresh, error: loadError } = await useFetch<Application[]>(
  "/api/applications",
  { default: () => [] },
);

const statusFilter = ref<Status | "All">("All");
const languageFilter = ref<Language | "All">("All");
const companySearch = ref("");
const positionFilter = ref("All");

// positions you have saved, for the dropdown
const positions = computed(() => [
  "All",
  ...new Set(applications.value.map((a) => a.position).sort((x, y) => x.localeCompare(y))),
]);

// fuzzy match on company name, so small typos still find the company
function searchCompany(items: Application[], query: string) {
  const q = query.trim();
  if (!q) return items;
  return new Fuse(items, { keys: ["company"], threshold: 0.4, ignoreLocation: true })
    .search(q)
    .map((r) => r.item);
}

const visible = computed(() => {
  let items = applications.value;
  if (statusFilter.value !== "All") items = items.filter((a) => a.status === statusFilter.value);
  if (languageFilter.value !== "All") items = items.filter((a) => a.language === languageFilter.value);
  if (positionFilter.value !== "All") items = items.filter((a) => a.position === positionFilter.value);
  return searchCompany(items, companySearch.value);
});

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

const MAX_CV_BYTES = 5 * 1024 * 1024;

const uploadCv = (id: string, file: File) => {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    error.value = "Only PDF files are allowed.";
    return;
  }
  if (file.size > MAX_CV_BYTES) {
    error.value = "The PDF is larger than 5 MB.";
    return;
  }
  return run(async () => {
    const body = new FormData();
    body.append("file", file);
    await $fetch(`/api/applications/${id}/cv`, { method: "POST", body });
    await refresh();
  });
};

const removeCv = (id: string) =>
  run(async () => {
    await $fetch(`/api/applications/${id}/cv`, { method: "DELETE" });
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
    <div class="flex flex-wrap items-end gap-2">
      <UFormField label="Company" class="min-w-56 flex-1">
        <UInput v-model="companySearch" placeholder="Search company..." class="w-full" />
      </UFormField>
      <UFormField label="Position">
        <USelect v-model="positionFilter" :items="positions" class="w-48" />
      </UFormField>
      <UFormField label="Language">
        <USelect v-model="languageFilter" :items="['All', ...LANGUAGES]" class="w-28" />
      </UFormField>
      <UFormField label="Status">
        <USelect v-model="statusFilter" :items="['All', ...STATUSES]" class="w-40" />
      </UFormField>
    </div>
    <ApplicationTable
      :applications="visible"
      @delete="remove"
      @update-status="updateStatus"
      @upload-cv="uploadCv"
      @remove-cv="removeCv"
    />
  </UContainer>
</template>
