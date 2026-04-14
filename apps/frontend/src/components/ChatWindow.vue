<template>
  <div class="chat-window" role="region" aria-label="Chat">
    <div ref="scrollEl" class="chat-messages" @scroll.passive="onScroll">
      <MessageList
        :messages="messages"
        :new-message-ids="newMessageIds"
        :loading="historyLoading"
      />
    </div>

    <div role="alert" aria-live="assertive" aria-atomic="true">
      <q-banner v-if="status === 'reconnecting'" dense class="bg-orange-1 text-grey-9">
        <template #avatar>
          <q-icon name="wifi_off" color="warning" aria-hidden="true" />
        </template>
        Connection lost. Reconnecting...
      </q-banner>
      <q-banner v-else-if="status === 'disconnected'" dense class="bg-grey-2 text-grey-7">
        <template #avatar>
          <q-icon name="cloud_off" color="grey-6" aria-hidden="true" />
        </template>
        You are offline. Sending is disabled.
      </q-banner>
    </div>

    <div role="status" aria-live="polite" aria-atomic="true">
      <q-banner v-if="status === 'syncing'" dense class="bg-blue-1 text-grey-9">
        <template #avatar>
          <q-icon name="sync" color="info" aria-hidden="true" />
        </template>
        Reconnected. Syncing missed messages...
      </q-banner>
    </div>

    <q-separator />

    <div class="q-pa-sm">
      <MessageComposer
        :disabled="disabled"
        :disabled-reason="disabledReason"
        @submit="(content) => emit('send', content)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import MessageComposer from './MessageComposer.vue'
import MessageList from './MessageList.vue'
import type { ChatMessage, ConnectionStatus } from '../chat/types'

const props = defineProps<{
  status: ConnectionStatus
  messages: ChatMessage[]
  newMessageIds: string[]
  disabled: boolean
  disabledReason: string
  historyLoading: boolean
}>()

const emit = defineEmits<{
  (event: 'send', content: string): void
}>()

const scrollEl = ref<HTMLElement | null>(null)
const isAtBottom = ref(true)

function onScroll() {
  const el = scrollEl.value
  if (!el) return
  isAtBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 60
}

watch(
  () => props.messages.length,
  async () => {
    if (!isAtBottom.value) return
    await nextTick()
    const el = scrollEl.value
    if (el) el.scrollTop = el.scrollHeight
  },
)
</script>
