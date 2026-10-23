<script setup lang="ts">
defineProps<{ applications: Application[] }>();
const emit = defineEmits<{
  delete: [id: string];
  "update-status": [id: string, status: Status];
}>();

function onStatusChange(id: string, event: Event) {
  emit(
    "update-status",
    id,
    (event.target as HTMLSelectElement).value as Status,
  );
}
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>Company</th>
        <th>Position</th>
        <th>Status</th>
        <th>Applied</th>
        <th>Link</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in applications" :key="item.id">
        <td>{{ item.company }}</td>
        <td>{{ item.position }}</td>
        <td>
          <StatusBadge :status="item.status" />
          <select
            :value="item.status"
            @change="onStatusChange(item.id, $event)"
          >
            <option v-for="s in STATUSES" :key="s">{{ s }}</option>
          </select>
        </td>
        <td>{{ item.appliedDate }}</td>
        <td>
          <a v-if="item.link" :href="item.link" target="_blank" rel="noopener"
            >open</a
          >
        </td>
        <td><button @click="emit('delete', item.id)">Delete</button></td>
      </tr>
      <tr v-if="!applications.length">
        <td colspan="6">No applications yet.</td>
      </tr>
    </tbody>
  </table>
</template>
