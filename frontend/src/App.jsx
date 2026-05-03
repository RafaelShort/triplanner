import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthProvider'  // ✅ vem do novo arquivo
import { useAuth } from './contexts/AuthContext'         // ✅ hook continua aqui
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import TripList from './pages/trips/TripList'
import TripForm from './pages/trips/TripForm'
import TripDetail from './pages/trips/TripDetail'
import TripPrintPage from './pages/trips/TripPrintPage'
import InvitePage from './pages/InvitePage'
import ProfilePage from './pages/ProfilePage'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="text-center mt-10">Carregando...</p>

  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  }

  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="text-center mt-10">Carregando...</p>
  return user ? <Navigate to="/trips" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/trips" replace />} />

      <Route
        path="/login"
        element={<PublicRoute><Login /></PublicRoute>}
      />
      <Route
        path="/register"
        element={<PublicRoute><Register /></PublicRoute>}
      />

      {/* InvitePage — pública, trata login internamente */}
      <Route
        path="/invites/:token"
        element={<InvitePage />}
      />

      <Route
        path="/trips"
        element={
          <PrivateRoute>
            <Layout><TripList /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/trips/new"
        element={
          <PrivateRoute>
            <Layout><TripForm /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/trips/:id/edit"
        element={
          <PrivateRoute>
            <Layout><TripForm /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/trips/:id"
        element={
          <PrivateRoute>
            <Layout><TripDetail /></Layout>
          </PrivateRoute>
        }
      />

      {/* Print — sem Header para ficar limpo */}
      <Route
        path="/trips/:id/print"
        element={
          <PrivateRoute>
            <TripPrintPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Layout><ProfilePage /></Layout>
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/trips" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
