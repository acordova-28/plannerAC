import { apiFetch } from './client'

export interface LoginResponse {
  access_token: string
  user: { id: string; nombre: string; ldapUid: string; email: string | null; picture?: string | null }
}

export async function loginApi(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? 'Credenciales incorrectas')
  }
  return res.json()
}

export async function getMeApi() {
  const res = await apiFetch('/api/auth/me')
  if (!res.ok) throw new Error('No autenticado')
  return res.json()
}

export interface AuthMethods {
  ldap: boolean
  microsoft: boolean
}

export async function getAuthMethodsApi(): Promise<AuthMethods> {
  const res = await fetch('/api/auth/methods')
  if (!res.ok) return { ldap: true, microsoft: false }
  return res.json()
}
