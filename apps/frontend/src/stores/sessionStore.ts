import { reactive } from 'vue'

const STORAGE_KEY = 'uxtweak.session'

const state = reactive({
  sessionId: '',
  nickname: '',
  isJoined: false,
})

function saveSession(sessionId: string, nickname: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, nickname }))
}

export const sessionStore = {
  state,
  join(sessionId: string, nickname: string) {
    state.sessionId = sessionId
    state.nickname = nickname
    state.isJoined = true
    saveSession(sessionId, nickname)
  },
  hydrateFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as { sessionId?: string; nickname?: string }
      if (!parsed.sessionId || !parsed.nickname) {
        return null
      }
      return { sessionId: parsed.sessionId, nickname: parsed.nickname }
    } catch {
      return null
    }
  },
  clear() {
    state.sessionId = ''
    state.nickname = ''
    state.isJoined = false
    localStorage.removeItem(STORAGE_KEY)
  },
}
