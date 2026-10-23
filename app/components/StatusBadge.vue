<script setup lang="ts">
defineProps<{ status: Status }>();
const colors: Record<Status, string> = {
  Applied: "#2563eb",
  Interview: "#d97706",
  Offer: "#16a34a",
  Rejected: "#dc2626",
};
</script>

<template>
  <span class="badge" :style="{ background: colors[status] }">{{
    status
  }}</span>
</template>

<style scoped>
.badge {
  color: #fff;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.8rem;
}
</style>
