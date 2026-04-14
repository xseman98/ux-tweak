<template>
  <div
    class="message-list"
    role="log"
    aria-label="Chat messages"
    aria-live="polite"
    aria-relevant="additions"
  >
    <div v-if="loading" class="message-list-empty" aria-label="Loading messages">
      <q-spinner color="primary" size="2rem" aria-hidden="true" />
    </div>

    <div v-else-if="messages.length === 0" class="message-list-empty" role="status">
      <q-icon name="chat_bubble_outline" size="3rem" color="grey-4" aria-hidden="true" />
      <div class="text-body2 text-grey-5 q-mt-sm">No messages yet. Say hello!</div>
    </div>

    <template v-else>
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-row"
        :class="isOwn(msg) ? 'message-row--own' : 'message-row--other'"
      >
        <div v-if="!isOwn(msg)" class="message-nick" aria-hidden="true">{{ msg.nickname }}</div>
        <div
          class="message-bubble"
          :class="[
            isOwn(msg) ? 'message-bubble--own' : 'message-bubble--other',
            isNew(msg.id) ? 'message-bubble--new' : '',
          ]"
          :aria-label="`${isOwn(msg) ? 'You' : msg.nickname}: ${msg.content}`"
        >
          {{ msg.content }}
        </div>
        <div class="message-time" aria-hidden="true">{{ formatTime(msg.createdAt) }}</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '../chat/types'
import { sessionStore } from '../stores/sessionStore'

const props = defineProps<{
  loading: boolean
  messages: ChatMessage[]
  newMessageIds: string[]
}>()

function isOwn(msg: ChatMessage) {
  return msg.sessionId === sessionStore.state.sessionId
}

function isNew(id: string) {
  return props.newMessageIds.includes(id)
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
