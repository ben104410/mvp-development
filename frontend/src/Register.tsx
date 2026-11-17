import axios from 'axios'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, ShieldCheck, Sparkles } from 'lucide-react'
import api from './api'

interface RegistrationForm {
  username: string
  email: string
  password: string
  password2: string
  role: 'user' | 'admin'
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
    role: 'user',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleRoleSelect(selectedRole: 'user' | 'admin') {
    setForm((current) => ({ ...current, role: selectedRole }))
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
        state: {
          message:
            form.role === 'admin'
              ? 'Administrator account created successfully! Please sign in.'
              : 'Account created successfully! Please sign in.',
        },
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

        {/* Account Role Selector */}
        <label>Account Role</label>
        <div className="auth-role-selector">
          <button
            type="button"
            className={`auth-role-card ${form.role === 'user' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('user')}
          >
            <div className="auth-role-header">
              <div className="auth-role-icon icon-user">
                <User size={18} />
              </div>
              <span className="auth-role-title">Normal User</span>
            </div>
            <p className="auth-role-desc">
              Discover workshops, register for events, and get QR passes.
            </p>
          </button>

          <button
            type="button"
            className={`auth-role-card ${form.role === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('admin')}
          >
            <div className="auth-role-header">
              <div className="auth-role-icon icon-admin">
                <ShieldCheck size={18} />
              </div>
              <span className="auth-role-title">Administrator</span>
            </div>
            <p className="auth-role-desc">
              Add and manage events, scan entrance tickets, and view analytics.
            </p>
          </button>
        </div>

        {form.role === 'admin' && (
          <div className="admin-privilege-notice">
            <Sparkles size={16} className="notice-icon" />
            <span>
              <strong>Administrator Access:</strong> You will be granted admin
              privileges to add events, scan entrance tickets, and post broadcasts.
            </span>
          </div>
        )}

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
          {loading
            ? 'Creating account...'
            : form.role === 'admin'
              ? 'Register as Administrator'
              : 'Register as Normal User'}
        </button>

        <p className="form-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  )
}
