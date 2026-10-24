<script setup lang="ts">
defineProps<{ applications: Application[] }>();
const emit = defineEmits<{
  delete: [id: string];
  "update-status": [id: string, status: Status];
  "upload-cv": [id: string, file: File];
  "remove-cv": [id: string];
}>();

// one hidden file input shared by all rows
const fileInput = ref<HTMLInputElement>();
let pendingId = "";
function pick(id: string) {
  pendingId = id;
  fileInput.value?.click();
}
function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) emit("upload-cv", pendingId, file);
}

const toast = useToast();
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({ title: "Copied", color: "success" });
  } catch {
    toast.add({ title: "Could not copy", color: "error" });
  }
}

const columns = [
  { accessorKey: "company", header: "Company" },
  { accessorKey: "position", header: "Position" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "language", header: "Language" },
  { accessorKey: "appliedDate", header: "Applied" },
  { accessorKey: "link", header: "Link" },
  { id: "description", header: "Description" },
  { id: "cv", header: "CV" },
  { id: "actions", header: "" },
];
</script>

<template>
  <input ref="fileInput" type="file" accept="application/pdf,.pdf" class="hidden" @change="onFile" />
  <UTable :data="applications" :columns="columns" empty="No applications yet.">
    <template #status-cell="{ row }">
      <UDropdownMenu
        :items="STATUSES.map((s) => ({ label: s, onSelect: () => emit('update-status', row.original.id, s) }))"
      >
        <button type="button" class="cursor-pointer">
          <StatusBadge :status="row.original.status" />
        </button>
      </UDropdownMenu>
    </template>
    <template #link-cell="{ row }">
      <UButton
        v-if="row.original.link"
        :to="row.original.link"
        target="_blank"
        rel="noopener"
        label="Open"
        variant="link"
        size="xs"
      />
    </template>
    <template #description-cell="{ row }">
      <UModal
        v-if="row.original.description"
        :title="`${row.original.company} - ${row.original.position}`"
      >
        <UButton icon="i-lucide-align-left" aria-label="Show description" title="Show description" color="neutral" variant="ghost" size="xs" />
        <template #actions>
          <UButton
            icon="i-lucide-copy"
            aria-label="Copy description"
            title="Copy description"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="copy(row.original.description!)"
          />
        </template>
        <template #body>
          <p class="whitespace-pre-wrap text-sm">{{ row.original.description }}</p>
        </template>
      </UModal>
    </template>
    <template #cv-cell="{ row }">
      <div class="flex items-center gap-4">
        <UButton
          v-if="row.original.cvName"
          :to="`/api/applications/${row.original.id}/cv`"
          external
          target="_blank"
          rel="noopener"
          icon="i-lucide-file-text"
          aria-label="Open CV"
          :title="`Open ${row.original.cvName}`"
          variant="ghost"
          size="xs"
        />
        <UButton
          v-else
          icon="i-lucide-upload"
          aria-label="Upload CV"
          title="Upload CV"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="pick(row.original.id)"
        />
        <UButton
          v-if="row.original.cvName"
          icon="i-lucide-trash-2"
          aria-label="Remove CV"
          title="Remove CV"
          color="error"
          variant="ghost"
          size="xs"
          @click="emit('remove-cv', row.original.id)"
        />
      </div>
    </template>
    <template #actions-cell="{ row }">
      <UButton
        label="Delete"
        color="error"
        variant="ghost"
        size="xs"
        @click="emit('delete', row.original.id)"
      />
    </template>
  </UTable>
</template>
