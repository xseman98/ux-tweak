import { io, type Socket } from 'socket.io-client'
import { connectionStore } from '../stores/connectionStore'
import { chatStore } from '../stores/chatStore'
import { sessionStore } from '../stores/sessionStore'
import type { ChatMessage } from './types'

let socket: Socket | null = null

function backendUrl() {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
}

function normalizeMessages(messages: ChatMessage[] | undefined) {
  return (messages || []).map((message) => ({
    ...message,
    createdAt: String(message.createdAt),
  }))
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

  socket.on('connect', () => {
    connectionStore.setStatus('connected')
  })

  socket.on('disconnect', () => {
    connectionStore.setStatus('disconnected')
  })

  socket.on('error', (payload: { message?: string }) => {
    connectionStore.setError(payload?.message || 'Unknown socket error')
  })

  socket.on('message:new', (message: ChatMessage) => {
    chatStore.addMessage({ ...message, createdAt: String(message.createdAt) })
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

  activeSocket.emit('message:send', { sessionId, content })
}
