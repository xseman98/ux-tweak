<template>
  <div
    class="row items-center no-wrap q-gutter-xs"
    role="status"
    aria-live="polite"
    :aria-label="`Connection status: ${label}`"
  >
    <span class="status-dot" :class="`status-dot--${status}`" aria-hidden="true" />
    <span class="text-caption text-grey-7">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ConnectionStatus } from '../chat/types'

const props = defineProps<{
  status: ConnectionStatus
}>()

const label = computed(() => {
  const labels: Record<ConnectionStatus, string> = {
    connected: 'Connected',
    connecting: 'Connecting...',
    reconnecting: 'Reconnecting...',
    syncing: 'Syncing...',
    disconnected: 'Disconnected',
  }
  return labels[props.status]
})
</script>
