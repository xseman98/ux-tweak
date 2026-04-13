<template>
  <q-card flat bordered class="chat-window">
    <q-card-section class="row items-center justify-between">
      <div class="text-subtitle1">Chat</div>
      <ConnectionStatus :status="status" />
    </q-card-section>

    <q-separator />

    <q-card-section class="chat-messages">
      <MessageList :messages="messages" :loading="historyLoading" />
    </q-card-section>

    <q-separator />

    <q-card-section>
      <MessageComposer :disabled="disabled" @submit="(content) => emit('send', content)" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import ConnectionStatus from './ConnectionStatus.vue'
import MessageComposer from './MessageComposer.vue'
import MessageList from './MessageList.vue'
import type { ChatMessage, ConnectionStatus as Status } from '../chat/types'

defineProps<{
  status: Status
  messages: ChatMessage[]
  disabled: boolean
  historyLoading: boolean
}>()

const emit = defineEmits<{
  (event: 'send', content: string): void
}>()
</script>
