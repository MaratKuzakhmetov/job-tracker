<script setup lang="ts">
defineProps<{ applications: Application[] }>();
const emit = defineEmits<{
  delete: [id: string];
  "update-status": [id: string, status: Status];
}>();

const columns = [
  { accessorKey: "company", header: "Company" },
  { accessorKey: "position", header: "Position" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "appliedDate", header: "Applied" },
  { accessorKey: "link", header: "Link" },
  { id: "actions", header: "" },
];
</script>

<template>
  <UTable :data="applications" :columns="columns" empty="No applications yet.">
    <template #status-cell="{ row }">
      <div class="flex items-center gap-2">
        <StatusBadge :status="row.original.status" />
        <USelect
          :model-value="row.original.status"
          :items="[...STATUSES]"
          size="xs"
          @update:model-value="emit('update-status', row.original.id, $event as Status)"
        />
      </div>
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
