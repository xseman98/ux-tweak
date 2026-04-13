export type ConnectionStatus = 'disconnected' | 'connecting' | 'reconnecting' | 'syncing' | 'connected'

export interface SocketErrorPayload {
  message: string
  code?: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  nickname: string
  content: string
  createdAt: string
}
