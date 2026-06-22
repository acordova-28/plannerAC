import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import LoginPage from './pages/LoginPage'
import Planner from './pages/Planner'
import NotFound from './pages/NotFound'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isValid = useAuthStore(s => s.isValid())
  return isValid ? <>{children}</> : <Navigate to="/login" replace />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <Planner />
      </PrivateRoute>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
