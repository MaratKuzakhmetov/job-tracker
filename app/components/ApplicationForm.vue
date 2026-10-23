<script setup lang="ts">
import { z } from "zod";

const emit = defineEmits<{ create: [payload: Omit<Application, "id">] }>();

const schema = z.object({
  company: z.string().min(1, "Required"),
  position: z.string().min(1, "Required"),
  link: z.union([z.literal(""), z.url({ protocol: /^https?$/, error: "Use an http(s) link" })]),
});

const today = new Date().toISOString().slice(0, 10);
const empty = (): Omit<Application, "id"> => ({
  company: "",
  position: "",
  status: "Applied",
  appliedDate: today,
  link: "",
  notes: "",
});
const state = reactive(empty());

function submit() {
  emit("create", { ...state });
  Object.assign(state, empty());
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    @submit="submit"
  >
    <UFormField label="Company" name="company" required>
      <UInput v-model="state.company" class="w-full" />
    </UFormField>
    <UFormField label="Position" name="position" required>
      <UInput v-model="state.position" class="w-full" />
    </UFormField>
    <UFormField label="Status" name="status">
      <USelect v-model="state.status" :items="[...STATUSES]" class="w-full" />
    </UFormField>
    <UFormField label="Applied" name="appliedDate">
      <UInput v-model="state.appliedDate" type="date" class="w-full" />
    </UFormField>
    <UFormField label="Link" name="link">
      <UInput v-model="state.link" placeholder="https://..." class="w-full" />
    </UFormField>
    <UFormField label="Notes" name="notes">
      <UInput v-model="state.notes" class="w-full" />
    </UFormField>
    <UButton type="submit" label="Add" class="justify-center sm:col-span-2 lg:col-span-3" />
  </UForm>
</template>
