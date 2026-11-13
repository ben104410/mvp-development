import axios from 'axios'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from './api'

interface RegistrationForm {
  username: string
  email: string
  password: string
  password2: string
}

function formatRegistrationError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Registration failed. Check your connection and try again.'
  }

  const data: unknown = error.response?.data
  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([key, value]) => {
        const detail = Array.isArray(value)
          ? value.map(String).join(', ')
          : String(value)
        return `${key}: ${detail}`
      })
      .join(' ')
  }

  return 'Registration failed. Check your connection and try again.'
}

export default function Register() {
  const [form, setForm] = useState<RegistrationForm>({
    username: '',
    email: '',
    password: '',
    password2: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (form.password !== form.password2) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/register/', form)
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. Please sign in.' },
      })
    } catch (requestError: unknown) {
      setError(formatRegistrationError(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Create an account</h1>
        <p>Join the Swahilipot Smart Hub community.</p>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          value={form.username}
          onChange={handleChange}
          autoComplete="username"
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

        <label htmlFor="password2">Confirm password</label>
        <input
          id="password2"
          name="password2"
          type="password"
          value={form.password2}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>

        <p className="form-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  )
}
