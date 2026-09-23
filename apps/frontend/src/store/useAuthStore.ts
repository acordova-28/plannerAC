import { create } from 'zustand'
import { loginApi, type LoginResponse } from '../api/auth.api'

interface AuthUser {
  id: string
  nombre: string
  ldapUid: string
  email: string | null
  picture?: string | null
}

interface AuthStore {
  token:      string | null
  user:       AuthUser | null
  error:      string | null
  loading:    boolean
  login:      (username: string, password: string) => Promise<void>
  setSession: (data: LoginResponse) => void
  logout:     () => void
  clearError: () => void
  isValid:    () => boolean
}

const TOKEN_KEY = 'wuolla_token'
const USER_KEY  = 'wuolla_user'

function parseExp(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ?? 0
  } catch {
    return 0
  }
}

const storedToken = localStorage.getItem(TOKEN_KEY)
const storedUser  = (() => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') } catch { return null }
})()

export const useAuthStore = create<AuthStore>((set, get) => ({
  token:   storedToken && storedUser ? storedToken : null,
  user:    storedToken && storedUser ? storedUser  : null,
  error:   null,
  loading: false,

  login: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const data = await loginApi(username, password)
      get().setSession(data)
      set({ loading: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión'
      set({ error: msg, loading: false })
    }
  },

  setSession: (data) => {
    localStorage.setItem(TOKEN_KEY, data.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    set({ token: data.access_token, user: data.user, error: null })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ token: null, user: null })
  },

  clearError: () => set({ error: null }),

  isValid: () => {
    const token = get().token
    if (!token) return false
    return parseExp(token) * 1000 > Date.now()
  },
}))
