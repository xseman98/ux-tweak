export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export interface ChatMessage {
  id: string
  sessionId: string
  nickname: string
  content: string
  createdAt: string
}
