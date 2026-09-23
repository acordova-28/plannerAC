import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const setSession = useAuthStore(s => s.setSession)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get('token')
    const rawUser = params.get('user')

    if (!token || !rawUser) {
      navigate('/login?error=ms_auth_failed', { replace: true })
      return
    }

    try {
      const user = JSON.parse(rawUser)
      setSession({ access_token: token, user })
      navigate('/', { replace: true })
    } catch {
      navigate('/login?error=ms_auth_failed', { replace: true })
    }
  }, [navigate, setSession])

  return null
}
