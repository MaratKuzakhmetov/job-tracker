<script setup lang="ts">
import { z } from "zod";

const props = defineProps<{ application?: Application }>();
const emit = defineEmits<{
  create: [payload: Omit<Application, "id">];
  save: [payload: Omit<Application, "id">];
}>();

const schema = z.object({
  company: z.string().min(1, "Required"),
  position: z.string().min(1, "Required"),
  description: z.string().max(20000, "Max 20000 characters"),
  link: z.union([
    z.literal(""),
    z.url({ protocol: /^https?$/, error: "Use an http(s) link" }),
  ]),
});

const today = new Date().toISOString().slice(0, 10);
const empty = (): Omit<Application, "id"> => ({
  company: "",
  position: "",
  status: "Applied",
  language: "EN",
  appliedDate: today,
  link: "",
  notes: "",
  description: "",
});
const fromApplication = (a: Application): Omit<Application, "id"> => ({
  company: a.company,
  position: a.position,
  status: a.status,
  language: a.language,
  appliedDate: a.appliedDate,
  link: a.link ?? "",
  notes: a.notes ?? "",
  description: a.description ?? "",
});
const state = reactive(
  props.application ? fromApplication(props.application) : empty(),
);

function submit() {
  if (props.application) {
    emit("save", { ...state });
  } else {
    emit("create", { ...state });
    Object.assign(state, empty());
  }
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
    <UFormField label="Language" name="language">
      <USelect
        v-model="state.language"
        :items="[...LANGUAGES]"
        class="w-full"
      />
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
    <UFormField
      label="Description"
      name="description"
      class="sm:col-span-2 lg:col-span-3"
    >
      <UTextarea
        v-model="state.description"
        :rows="4"
        placeholder="Paste the job posting text..."
        class="w-full"
      />
    </UFormField>
    <UButton
      type="submit"
      :label="application ? 'Save' : 'Add'"
      class="justify-center sm:col-span-2 lg:col-span-3"
    />
  </UForm>
</template>
