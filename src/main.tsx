import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import LoginPage from './pages/LoginPage'
import { useAuthStore } from './store/useAuthStore'

function Root() {
  const isValid = useAuthStore(s => s.isValid())
  return isValid ? <App /> : <LoginPage />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
