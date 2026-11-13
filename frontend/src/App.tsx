import { useState, useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom'
import Login from './Login'
import Register from './Register'
import Navbar from './components/Navbar'
import EventsPage from './pages/EventsPage'
import MyTicketsPage from './pages/MyTicketsPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import FeedbackPage from './pages/FeedbackPage'
import OrganizerPage from './pages/OrganizerPage'
import ProfilePage from './pages/ProfilePage'
import { ToastProvider } from './components/Toast'
import type { UserProfile } from './types'
import api from './api'
import './App.css'

function Layout({
  user,
  onLogout,
}: {
  user: UserProfile | null
  onLogout: () => void
}) {
  return (
    <div className="app-shell">
      <Navbar user={user} onLogout={onLogout} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

function ProtectedRoute({
  user,
  onLogout,
}: {
  user: UserProfile | null
  onLogout: () => void
}) {
  const token = localStorage.getItem('access')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <Layout user={user} onLogout={onLogout} />
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (token && !user) {
      api
        .get<UserProfile>('/auth/me/')
        .then((res) => {
          setUser(res.data)
          localStorage.setItem('user', JSON.stringify(res.data))
        })
        .catch(() => {
          localStorage.removeItem('access')
          localStorage.removeItem('refresh')
          localStorage.removeItem('user')
        })
    }
  }, [user])

  function handleLogout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute user={user} onLogout={handleLogout} />}>
            <Route path="/" element={<Navigate to="/events" replace />} />
            <Route path="/events" element={<EventsPage user={user} />} />
            <Route path="/tickets" element={<MyTicketsPage />} />
            <Route path="/announcements" element={<AnnouncementsPage user={user} />} />
            <Route path="/feedback" element={<FeedbackPage user={user} />} />
            <Route path="/organizer" element={<OrganizerPage user={user} />} />
            <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} />} />
            <Route path="/dashboard" element={<Navigate to="/events" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
