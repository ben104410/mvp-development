import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Login from './Login'
import Register from './Register'
import './App.css'

function Dashboard() {
  const navigate = useNavigate()
  const user = (() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })()

  function handleLogout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  return (
    <main className="dashboard">
      <h1>Smart Hub Dashboard</h1>
      <p>
        {user?.username
          ? `Welcome back, ${user.username}!`
          : 'Welcome to your Smart Hub dashboard.'}
      </p>
      <button type="button" onClick={handleLogout}>
        Logout
      </button>
    </main>
  )
}

function ProtectedDashboard() {
  return localStorage.getItem('access') ? (
    <Dashboard />
  ) : (
    <Navigate to="/login" replace />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedDashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
