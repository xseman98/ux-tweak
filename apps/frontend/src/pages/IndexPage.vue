<template>
  <q-page class="chat-page">
    <JoinForm v-if="!sessionStore.state.isJoined && !isRestoring" :loading="isJoining" @submit="handleJoin" />
    <q-card v-else-if="isRestoring" flat bordered class="join-card">
      <q-card-section class="text-caption text-grey-7">Restoring session...</q-card-section>
    </q-card>

    <ChatWindow
      v-else
      :status="connectionStore.state.status"
      :messages="chatStore.state.messages"
      :new-message-ids="chatStore.state.newlySyncedMessageIds"
      :disabled="composerDisabled"
      :disabled-reason="composerDisabledReason"
      :history-loading="isHistoryLoading"
      @send="handleSend"
    />

    <q-banner v-if="connectionStore.state.error" dense inline-actions class="bg-red-1 text-negative q-mt-md">
      {{ connectionStore.state.error }}
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ChatWindow from '../components/ChatWindow.vue'
import JoinForm from '../components/JoinForm.vue'
import { joinSession, resumeSession, sendMessage } from '../chat/socket'
import { chatStore } from '../stores/chatStore'
import { connectionStore } from '../stores/connectionStore'
import { sessionStore } from '../stores/sessionStore'

const isJoining = ref(false)
const isRestoring = ref(true)
const isHistoryLoading = ref(false)

const composerDisabled = computed(() => connectionStore.state.status !== 'connected')
const composerDisabledReason = computed(() => {
  if (connectionStore.state.status === 'syncing') {
    return 'Syncing missed messages...'
  }
  if (connectionStore.state.status === 'reconnecting' || connectionStore.state.status === 'disconnected') {
    return 'Offline. Message sending is temporarily disabled.'
  }
  return ''
})

async function handleJoin(nickname: string) {
  isJoining.value = true
  isHistoryLoading.value = true
  connectionStore.clearError()

  try {
    await joinSession(nickname)
  } catch (error) {
    connectionStore.setError(error instanceof Error ? error.message : 'Join failed')
    chatStore.clear()
  } finally {
    isJoining.value = false
    isHistoryLoading.value = false
  }
}

async function handleSend(content: string) {
  try {
    await sendMessage(content)
  } catch (error) {
    connectionStore.setError(error instanceof Error ? error.message : 'Send failed')
  }
}

onMounted(async () => {
  const session = sessionStore.hydrateFromStorage()
  if (!session) {
    isRestoring.value = false
    return
  }

  isHistoryLoading.value = true
  connectionStore.clearError()

  try {
    await resumeSession(session.sessionId)
  } catch {
    sessionStore.clear()
    chatStore.clear()
    connectionStore.setError('Session restore failed. Please join again.')
  } finally {
    isHistoryLoading.value = false
    isRestoring.value = false
  }
})
</script>
