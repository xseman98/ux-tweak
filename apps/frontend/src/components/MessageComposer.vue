<template>
  <q-form @submit.prevent="submit" class="row q-col-gutter-sm items-center">
    <div class="col">
      <q-input
        v-model="value"
        outlined
        dense
        label="Write message"
        maxlength="500"
        :disable="disabled"
      />
    </div>
    <div class="col-auto">
      <q-btn type="submit" color="primary" label="Send" :disable="disabled || !canSubmit" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

defineProps<{
  disabled: boolean
}>()

const emit = defineEmits<{
  (event: 'submit', content: string): void
}>()

const value = ref('')

const canSubmit = computed(() => value.value.trim().length > 0)

function submit() {
  const content = value.value.trim()
  if (!content) {
    return
  }

  emit('submit', content)
  value.value = ''
}
</script>
