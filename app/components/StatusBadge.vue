<script setup lang="ts">
defineProps<{ status: Status }>();
const colors = {
  Applied: "info",
  Interview: "warning",
  Offer: "success",
  Rejected: "error",
} as const;
</script>

<template>
  <UBadge :color="colors[status]" variant="subtle">{{ status }}</UBadge>
</template>
