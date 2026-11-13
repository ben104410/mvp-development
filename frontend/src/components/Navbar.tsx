import { Link, useLocation } from 'react-router-dom'
import {
  Calendar,
  Ticket,
  Bell,
  MessageSquare,
  ShieldCheck,
  LogOut,
  User,
} from 'lucide-react'
import type { UserProfile } from '../types'

interface NavbarProps {
  user: UserProfile | null
  onLogout: () => void
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const location = useLocation()
  const isOrganizer = Boolean(
    user?.is_superuser ||
      user?.groups?.some((g) => ['organizer', 'admin'].includes(g)),
  )

  const navLinks = [
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/tickets', label: 'My Tickets', icon: Ticket },
    { to: '/announcements', label: 'News & Updates', icon: Bell },
    { to: '/feedback', label: 'Feedback', icon: MessageSquare },
  ]

  if (isOrganizer) {
    navLinks.push({
      to: '/organizer',
      label: 'Organizer Panel',
      icon: ShieldCheck,
    })
  }

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/events" className="brand">
          <span className="brand-dot" />
          <span className="brand-title">Smart Track</span>
          <span className="brand-badge">Hub</span>
        </Link>

        <nav className="nav-menu">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`nav-link ${active ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="nav-user-section">
          {user && (
            <div className="user-pill">
              <User size={16} />
              <span className="user-name">{user.username}</span>
              {isOrganizer && <span className="role-tag">Organizer</span>}
            </div>
          )}
          <button
            type="button"
            className="btn-logout"
            onClick={onLogout}
            title="Log out"
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
