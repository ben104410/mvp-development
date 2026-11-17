import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { User, ShieldCheck } from 'lucide-react'
import api from './api'
import type { UserProfile } from './types'
import { isUserAdminOrOrganizer } from './types'

interface TokenResponse {
  access: string
  refresh: string
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const message =
    typeof location.state?.message === 'string' ? location.state.message : ''

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post<TokenResponse>('/auth/login/', {
        username,
        password,
      })

      localStorage.setItem('access', response.data.access)
      localStorage.setItem('refresh', response.data.refresh)

      try {
        const profile = await api.get<UserProfile>('/auth/me/')
        localStorage.setItem('user', JSON.stringify(profile.data))

        const isAdmin = isUserAdminOrOrganizer(profile.data)

        if (role === 'admin' && !isAdmin) {
          localStorage.removeItem('access')
          localStorage.removeItem('refresh')
          localStorage.removeItem('user')
          setError(
            'Access Denied: This account does not have administrator privileges. Please switch to "Normal User" or register an Administrator account.',
          )
          return
        }

        if (role === 'admin' || isAdmin) {
          navigate('/organizer', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
        return
      } catch {
        navigate('/dashboard', { replace: true })
      }
    } catch (requestError: unknown) {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      localStorage.removeItem('user')

      setError(
        axios.isAxiosError(requestError) && requestError.response?.status === 401
          ? 'Invalid username or password.'
          : 'Unable to connect to the server. Check that Django is running.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <h1>Swahilipot Smart Hub</h1>
        <p>Sign in to your account</p>

        {message && (
          <p className="success" role="status">
            {message}
          </p>
        )}

        {/* Portal Role Tabs */}
        <label>Portal Role</label>
        <div className="login-role-tabs">
          <button
            type="button"
            className={`login-role-tab ${role === 'user' ? 'active' : ''}`}
            onClick={() => {
              setRole('user')
              setError('')
            }}
          >
            <User size={16} />
            <span>Normal User</span>
          </button>
          <button
            type="button"
            className={`login-role-tab ${role === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setRole('admin')
              setError('')
            }}
          >
            <ShieldCheck size={16} />
            <span>Administrator</span>
          </button>
        </div>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading
            ? 'Signing in...'
            : role === 'admin'
              ? 'Sign in as Administrator'
              : 'Sign in as Normal User'}
        </button>

        <p className="form-footer">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </main>
  )
}
