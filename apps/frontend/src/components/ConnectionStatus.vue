<template>
  <div class="connection-status" :class="`connection-status--${status}`">
    {{ label }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ConnectionStatus } from '../chat/types'

const props = defineProps<{
  status: ConnectionStatus
}>()

const label = computed(() => {
  if (props.status === 'connected') {
    return 'Connected'
  }
  if (props.status === 'connecting') {
    return 'Connecting...'
  }
  if (props.status === 'reconnecting') {
    return 'Reconnecting...'
  }
  if (props.status === 'syncing') {
    return 'Syncing messages...'
  }
  return 'Disconnected'
})
</script>
