<template>
  <div class="message-list">
    <div v-if="loading" class="text-grey-6 text-caption">
      Loading messages...
    </div>
    <div v-else-if="messages.length === 0" class="text-grey-6 text-caption">
      No messages yet.
    </div>
    <q-list v-else separator>
      <q-item v-for="message in messages" :key="message.id">
        <q-item-section>
          <div class="message-meta">{{ message.nickname }}</div>
          <div>{{ message.content }}</div>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '../chat/types'

defineProps<{
  loading: boolean
  messages: ChatMessage[]
}>()
</script>
