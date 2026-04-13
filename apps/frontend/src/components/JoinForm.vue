<template>
  <q-card flat bordered class="join-card">
    <q-card-section>
      <div class="text-h6">Join chat</div>
      <div class="text-caption text-grey-7">Enter a nickname to start chatting.</div>
    </q-card-section>

    <q-card-section>
      <q-form @submit.prevent="submit">
        <q-input
          v-model="nickname"
          outlined
          label="Nickname"
          maxlength="50"
          :disable="loading"
        />
        <div class="q-mt-md">
          <q-btn type="submit" color="primary" label="Join" :loading="loading" :disable="loading || !canSubmit" />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  (event: 'submit', nickname: string): void
}>()

const nickname = ref('')

const canSubmit = computed(() => nickname.value.trim().length > 0)

function submit() {
  const value = nickname.value.trim()
  if (!value) {
    return
  }

  emit('submit', value)
}
</script>
