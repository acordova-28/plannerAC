import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export default function LoginPage() {
  const login      = useAuthStore(s => s.login)
  const error      = useAuthStore(s => s.error)
  const loading    = useAuthStore(s => s.loading)
  const clearError = useAuthStore(s => s.clearError)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login(username, password)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-[#1A5276] text-white px-6 py-4 shrink-0">
        <div className="text-lg font-bold tracking-wide">📋 WUOLLA Planner</div>
        <div className="text-xs opacity-70 mt-0.5">
          Control de estimación y seguimiento de tareas
        </div>
      </header>

      {/* Centered card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm overflow-hidden">
          {/* Card header */}
          <div className="bg-[#1A5276]/5 border-b border-slate-100 px-8 py-5">
            <h1 className="text-xl font-bold text-[#1A5276] text-center">
              Iniciar sesión
            </h1>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm
                              font-semibold rounded-lg px-4 py-3 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-bold text-[#1A5276] mb-1.5"
                >
                  Usuario
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); clearError() }}
                  placeholder="tu.usuario"
                  autoComplete="username"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:border-[#1A5276] focus:ring-1
                             focus:ring-[#1A5276] transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-[#1A5276] mb-1.5"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError() }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:border-[#1A5276] focus:ring-1
                             focus:ring-[#1A5276] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full bg-[#1A5276] hover:bg-[#154360] disabled:bg-[#7FB3D3]
                           disabled:cursor-not-allowed text-white font-bold py-3
                           rounded-lg transition-colors text-sm mt-1"
              >
                {loading ? 'Verificando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
