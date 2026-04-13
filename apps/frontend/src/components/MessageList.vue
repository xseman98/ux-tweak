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
          <div class="message-meta">
            {{ message.nickname }}
            <span class="text-grey-6 q-ml-sm">{{ formatSentAt(message.createdAt) }}</span>
            <q-badge v-if="isNew(message.id)" color="primary" outline class="q-ml-sm">NEW</q-badge>
          </div>
          <div>{{ message.content }}</div>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '../chat/types'

const props = defineProps<{
  loading: boolean
  messages: ChatMessage[]
  newMessageIds: string[]
}>()

function formatSentAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function isNew(messageId: string) {
  return props.newMessageIds.includes(messageId)
}
</script>
