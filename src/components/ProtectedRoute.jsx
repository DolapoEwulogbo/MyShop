import { Navigate, useLocation } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// Gates /checkout and /orders per AGENTS.md Section 5.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading message="Checking sign-in..." />
  if (!user) {
    const returnTo = location.pathname + location.search
    return <Navigate to={'/login?returnTo=' + encodeURIComponent(returnTo)} replace />
  }
  return children
}
