import { create } from 'zustand'

const TOKEN_KEY = 'wuolla_token'

export interface AuthUser {
  username: string
  nombre:   string
  email:    string
}

interface AuthStore {
  token:   string | null
  user:    AuthUser | null
  error:   string | null
  loading: boolean

  login:      (username: string, password: string) => Promise<void>
  logout:     () => void
  clearError: () => void
  isValid:    () => boolean
}

function parseToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp * 1000 <= Date.now()) return null
    return { username: payload.sub, nombre: payload.nombre, email: payload.email }
  } catch {
    return null
  }
}

const storedToken = localStorage.getItem(TOKEN_KEY)
const storedUser  = storedToken ? parseToken(storedToken) : null

export const useAuthStore = create<AuthStore>((set, get) => ({
  token:   storedUser ? storedToken : null,
  user:    storedUser,
  error:   null,
  loading: false,

  login: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = data.message ?? 'Usuario o contraseña incorrectos'
        set({ error: msg, loading: false })
        return
      }

      localStorage.setItem(TOKEN_KEY, data.token)
      set({ token: data.token, user: data.user, loading: false, error: null })
    } catch {
      set({ error: 'No se pudo conectar con el servidor', loading: false })
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ token: null, user: null, error: null })
  },

  clearError: () => set({ error: null }),

  isValid: () => {
    const { token } = get()
    if (!token) return false
    return parseToken(token) !== null
  },
}))
