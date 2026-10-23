<script setup lang="ts">
const emit = defineEmits<{ create: [payload: Omit<Application, "id">] }>();

const today = new Date().toISOString().slice(0, 10);
const empty = (): Omit<Application, "id"> => ({
  company: "",
  position: "",
  status: "Applied",
  appliedDate: today,
  link: "",
  notes: "",
});
const form = reactive(empty());

function submit() {
  emit("create", { ...form });
  Object.assign(form, empty());
}
</script>

<template>
  <form @submit.prevent="submit">
    <input v-model="form.company" placeholder="Company" required />
    <input v-model="form.position" placeholder="Position" required />
    <select v-model="form.status">
      <option v-for="s in STATUSES" :key="s">{{ s }}</option>
    </select>
    <input v-model="form.appliedDate" type="date" />
    <input v-model="form.link" type="url" placeholder="Link (optional)" />
    <input v-model="form.notes" placeholder="Notes (optional)" />
    <button type="submit">Add</button>
  </form>
</template>
