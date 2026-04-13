import { io, type Socket } from 'socket.io-client'
import { connectionStore } from '../stores/connectionStore'
import { chatStore } from '../stores/chatStore'
import { sessionStore } from '../stores/sessionStore'
import type { ChatMessage, SocketErrorPayload } from './types'

let socket: Socket | null = null
let didConnectBefore = false
let browserNetworkListenersAttached = false

function backendUrl() {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
}

function normalizeMessages(messages: ChatMessage[] | undefined) {
  return (messages || []).map((message) => ({
    ...message,
    createdAt: String(message.createdAt),
  }))
}

function syncMessages(activeSocket: Socket, afterMessageId?: string) {
  return new Promise<ChatMessage[]>((resolve, reject) => {
    activeSocket.emit(
      'messages:sync',
      { afterMessageId },
      (response: { messages?: ChatMessage[]; message?: string } | undefined) => {
        if (!response) {
          reject(new Error('Sync failed'))
          return
        }
        if (response.message && !response.messages) {
          reject(new Error(response.message))
          return
        }
        resolve(normalizeMessages(response.messages))
      },
    )
  })
}

function resumeForReconnect(activeSocket: Socket, sessionId: string) {
  return new Promise<{ sessionId?: string; nickname?: string }>((resolve, reject) => {
    activeSocket.emit(
      'session:resume',
      { sessionId },
      (response: { sessionId?: string; nickname?: string } | undefined) => {
        if (!response?.sessionId || !response.nickname) {
          reject(new Error('Failed to resume session'))
          return
        }
        resolve(response)
      },
    )
  })
}

export function connectSocket() {
  if (socket) {
    return socket
  }

  connectionStore.setStatus('connecting')
  connectionStore.clearError()

  socket = io(backendUrl(), {
    transports: ['websocket'],
  })

  if (!browserNetworkListenersAttached) {
    window.addEventListener('offline', () => {
      if (socket && socket.connected) {
        socket.disconnect()
      }
      connectionStore.setStatus('disconnected')
      connectionStore.setError('You are offline.')
    })
    window.addEventListener('online', () => {
      if (!socket) {
        return
      }
      if (socket.connected) {
        connectionStore.setStatus('connected')
        connectionStore.clearError()
        return
      }
      connectionStore.setStatus('reconnecting')
      connectionStore.clearError()
      socket.connect()
    })
    browserNetworkListenersAttached = true
  }

  socket.on('connect', async () => {
    const shouldResync = didConnectBefore && sessionStore.state.isJoined && Boolean(sessionStore.state.sessionId)
    if (!shouldResync) {
      connectionStore.setStatus('connected')
      didConnectBefore = true
      return
    }

    connectionStore.setStatus('syncing')
    connectionStore.clearError()
    const lastKnownId = chatStore.lastMessageId() || undefined
    const knownIds = new Set(chatStore.state.messages.map((m) => m.id))
    try {
      const resumed = await resumeForReconnect(socket!, sessionStore.state.sessionId)
      sessionStore.join(resumed.sessionId!, resumed.nickname!)
      const synced = await syncMessages(socket!, lastKnownId)
      chatStore.mergeMessages(synced)
      chatStore.markNewSince(knownIds)
      connectionStore.setStatus('connected')
    } catch (error) {
      sessionStore.clear()
      connectionStore.setStatus('disconnected')
      connectionStore.setError(error instanceof Error ? error.message : 'Failed to resume session')
    } finally {
      didConnectBefore = true
    }
  })

  socket.on('disconnect', () => {
    connectionStore.setStatus('disconnected')
  })

  socket.io.on('reconnect_attempt', () => {
    connectionStore.setStatus('reconnecting')
  })

  socket.on('error', (payload: SocketErrorPayload | undefined) => {
    connectionStore.setError(payload?.message || 'Unknown socket error')
  })

  socket.on('message:new', (message: ChatMessage) => {
    if (!navigator.onLine) {
      return
    }
    chatStore.addMessage({ ...message, createdAt: String(message.createdAt) })
  })

  socket.on('messages:synced', (payload: { messages?: ChatMessage[] }) => {
    chatStore.mergeMessages(normalizeMessages(payload.messages), { markAsNew: true })
  })

  socket.on('session:joined', (payload: { sessionId: string; nickname: string; messages?: ChatMessage[] }) => {
    sessionStore.join(payload.sessionId, payload.nickname)
    chatStore.setMessages(normalizeMessages(payload.messages))
  })

  socket.on('session:resumed', (payload: { sessionId: string; nickname: string; messages?: ChatMessage[] }) => {
    sessionStore.join(payload.sessionId, payload.nickname)
    chatStore.setMessages(normalizeMessages(payload.messages))
  })

  return socket
}

export async function joinSession(nickname: string) {
  const activeSocket = connectSocket()

  return new Promise<void>((resolve, reject) => {
    activeSocket.emit('session:join', { nickname }, (response: { sessionId?: string; messages?: ChatMessage[] }) => {
      if (!response?.sessionId) {
        reject(new Error('Failed to join session'))
        return
      }

      sessionStore.join(response.sessionId, nickname)
      chatStore.setMessages(normalizeMessages(response.messages))
      resolve()
    })
  })
}

export async function resumeSession(sessionId: string) {
  const activeSocket = connectSocket()

  return new Promise<void>((resolve, reject) => {
    activeSocket.emit(
      'session:resume',
      { sessionId },
      (response: { sessionId?: string; nickname?: string; messages?: ChatMessage[] }) => {
        if (!response?.sessionId || !response.nickname) {
          reject(new Error('Failed to resume session'))
          return
        }

        sessionStore.join(response.sessionId, response.nickname)
        chatStore.setMessages(normalizeMessages(response.messages))
        didConnectBefore = true
        resolve()
      },
    )
  })
}

export async function sendMessage(content: string) {
  const activeSocket = connectSocket()
  const sessionId = sessionStore.state.sessionId

  if (!sessionId) {
    throw new Error('Session is not ready')
  }
  if (connectionStore.state.status !== 'connected') {
    throw new Error('You are offline. Wait until connection is restored.')
  }

  activeSocket.emit('message:send', { sessionId, content })
}
