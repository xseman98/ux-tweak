<template>
  <q-card flat bordered class="chat-window">
    <q-card-section class="row items-center justify-between">
      <div class="text-subtitle1">Chat</div>
      <ConnectionStatus :status="status" />
    </q-card-section>

    <q-separator />

    <q-card-section class="chat-messages">
      <MessageList :messages="messages" :new-message-ids="newMessageIds" :loading="historyLoading" />
    </q-card-section>

    <q-separator />

    <q-banner v-if="status === 'reconnecting'" dense class="bg-orange-1 text-warning">
      Connection lost. Trying to reconnect...
    </q-banner>
    <q-banner v-if="status === 'syncing'" dense class="bg-blue-1 text-primary">
      Reconnected. Syncing missed messages...
    </q-banner>
    <q-banner v-if="status === 'disconnected'" dense class="bg-grey-2 text-grey-8">
      You are offline. Sending is temporarily disabled.
    </q-banner>

    <q-card-section>
      <MessageComposer :disabled="disabled" :disabled-reason="disabledReason" @submit="(content) => emit('send', content)" />
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
  newMessageIds: string[]
  disabled: boolean
  disabledReason: string
  historyLoading: boolean
}>()

const emit = defineEmits<{
  (event: 'send', content: string): void
}>()
</script>
