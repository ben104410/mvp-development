import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from './api'

interface TokenResponse {
  access: string
  refresh: string
}

interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  groups: string[]
  is_superuser: boolean
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
      } catch {
        // Fall back gracefully if profile cannot be fetched
      }

      navigate('/dashboard', { replace: true })
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
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="form-footer">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </main>
  )
}
