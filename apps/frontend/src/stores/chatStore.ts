import { reactive } from 'vue'
import type { ChatMessage } from '../chat/types'

const NEW_MESSAGE_HIGHLIGHT_MS = 4000

const state = reactive({
  messages: [] as ChatMessage[],
  newlySyncedMessageIds: [] as string[],
})

let clearMarkersTimer: ReturnType<typeof setTimeout> | null = null

function scheduleMarkerClear() {
  if (clearMarkersTimer !== null) clearTimeout(clearMarkersTimer)
  clearMarkersTimer = setTimeout(() => {
    state.newlySyncedMessageIds = []
    clearMarkersTimer = null
  }, NEW_MESSAGE_HIGHLIGHT_MS)
}

export const chatStore = {
  state,
  lastMessageId() {
    return state.messages.at(-1)?.id || ''
  },
  setMessages(messages: ChatMessage[]) {
    const merged = [...messages]
    merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    state.messages = merged
    state.newlySyncedMessageIds = []
  },
  addMessage(message: ChatMessage) {
    this.mergeMessages([message])
  },
  mergeMessages(messages: ChatMessage[], options?: { markAsNew?: boolean }) {
    const existingIds = new Set(state.messages.map((message) => message.id))
    const byId = new Map(state.messages.map((message) => [message.id, message]))
    for (const message of messages) {
      byId.set(message.id, message)
    }
    state.messages = Array.from(byId.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    if (options?.markAsNew) {
      const incomingNewIds = messages.filter((message) => !existingIds.has(message.id)).map((message) => message.id)
      const markers = new Set(state.newlySyncedMessageIds)
      for (const id of incomingNewIds) {
        markers.add(id)
      }
      state.newlySyncedMessageIds = Array.from(markers)
      if (incomingNewIds.length > 0) scheduleMarkerClear()
    }
  },
  markNewSince(knownIds: Set<string>) {
    const markers = new Set(state.newlySyncedMessageIds)
    let added = false
    for (const msg of state.messages) {
      if (!knownIds.has(msg.id)) {
        markers.add(msg.id)
        added = true
      }
    }
    state.newlySyncedMessageIds = Array.from(markers)
    if (added) scheduleMarkerClear()
  },
  clearNewMessageMarkers() {
    state.newlySyncedMessageIds = []
  },
  clear() {
    state.messages = []
    state.newlySyncedMessageIds = []
  },
}
