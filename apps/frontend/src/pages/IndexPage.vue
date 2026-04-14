<template>
  <q-page :class="showChat ? '' : 'chat-page'" :style-fn="showChat ? chatPageStyle : undefined">
    <q-banner
      v-if="connectionStore.state.error"
      role="alert"
      dense
      inline-actions
      class="bg-red-1 text-negative"
    >
      {{ connectionStore.state.error }}
      <template #action>
        <q-btn
          flat dense round
          icon="close"
          size="sm"
          aria-label="Dismiss error"
          @click="connectionStore.clearError()"
        />
      </template>
    </q-banner>

    <q-card v-if="isRestoring" flat bordered class="join-card">
      <q-card-section class="row items-center q-gutter-sm" aria-label="Restoring session" aria-busy="true">
        <q-spinner color="primary" size="1.2rem" aria-hidden="true" />
        <span class="text-caption text-grey-7">Restoring session...</span>
      </q-card-section>
    </q-card>

    <JoinForm v-else-if="!sessionStore.state.isJoined" :loading="isJoining" @submit="handleJoin" />

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

const showChat = computed(() => sessionStore.state.isJoined && !isRestoring.value)

function chatPageStyle(offset: number) {
  return { height: `calc(100vh - ${offset}px)`, display: 'flex', flexDirection: 'column' }
}

const composerDisabled = computed(() => connectionStore.state.status !== 'connected')
const composerDisabledReason = computed(() => {
  if (connectionStore.state.status === 'syncing') return 'Syncing missed messages...'
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
