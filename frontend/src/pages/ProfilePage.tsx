import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Shield,
  Ticket,
  CheckCircle,
  MessageSquare,
  Calendar,
  LogOut,
} from 'lucide-react'
import type { UserProfile, EventRegistrationItem, FeedbackItem } from '../types'
import api from '../api'

interface ProfilePageProps {
  user: UserProfile | null
  onLogout: () => void
}

export default function ProfilePage({ user, onLogout }: ProfilePageProps) {
  const [registrations, setRegistrations] = useState<EventRegistrationItem[]>([])
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)

  const isOrganizer = Boolean(
    user?.is_superuser ||
      user?.groups?.some((g) => ['organizer', 'admin'].includes(g)),
  )

  useEffect(() => {
    async function loadUserData() {
      setLoading(true)
      try {
        const [regRes, fbRes] = await Promise.all([
          api.get<EventRegistrationItem[]>('/mine/').catch(() => ({ data: [] })),
          api.get<FeedbackItem[]>('/feedback/').catch(() => ({ data: [] })),
        ])
        setRegistrations(regRes.data)
        setFeedbacks(fbRes.data)
      } finally {
        setLoading(false)
      }
    }
    loadUserData()
  }, [])

  const checkedInCount = registrations.filter((r) => r.checked_in).length

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="page-sub">Member Account</span>
          <h1 className="page-title">My Profile & Engagement</h1>
          <p className="page-desc">
            Manage your account information and view your Swahilipot Hub participation.
          </p>
        </div>

        <button
          type="button"
          className="btn-danger-outline"
          onClick={onLogout}
          title="Sign out of your account"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="profile-grid">
        {/* User Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            <User size={36} />
          </div>

          <h2 className="profile-username">{user?.username}</h2>
          <span className="profile-role-badge">
            {isOrganizer ? 'Organizer / Administrator' : 'Community Member'}
          </span>

          <div className="profile-info-list">
            <div className="info-item">
              <Mail size={16} className="info-icon" />
              <div>
                <span className="info-label">Email Address</span>
                <span className="info-val">{user?.email || 'No email provided'}</span>
              </div>
            </div>

            <div className="info-item">
              <Shield size={16} className="info-icon" />
              <div>
                <span className="info-label">Account Permissions</span>
                <span className="info-val">
                  {user?.is_superuser
                    ? 'Superuser Access'
                    : user?.groups.length
                      ? user.groups.join(', ')
                      : 'Standard Attendee'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="profile-stats-col">
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrap icon-blue">
                <Ticket size={22} />
              </div>
              <div className="kpi-body">
                <span className="kpi-value">{registrations.length}</span>
                <span className="kpi-label">Passes Booked</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap icon-green">
                <CheckCircle size={22} />
              </div>
              <div className="kpi-body">
                <span className="kpi-value">{checkedInCount}</span>
                <span className="kpi-label">Events Attended</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap icon-purple">
                <MessageSquare size={22} />
              </div>
              <div className="kpi-body">
                <span className="kpi-value">{feedbacks.length}</span>
                <span className="kpi-label">Feedback Given</span>
              </div>
            </div>
          </div>

          {/* Activity Overview */}
          <div className="profile-activity-card">
            <h3>Recent Event Registrations</h3>
            {loading ? (
              <p className="loading-text">Loading activity...</p>
            ) : registrations.length === 0 ? (
              <p className="empty-text">No event registrations found.</p>
            ) : (
              <div className="activity-list">
                {registrations.slice(0, 5).map((reg) => (
                  <div key={reg.id} className="activity-row">
                    <div className="activity-info">
                      <strong>{reg.event_title}</strong>
                      <span className="activity-sub">
                        <Calendar size={12} />{' '}
                        {new Date(reg.event_starts_at).toLocaleDateString()} • {reg.event_venue}
                      </span>
                    </div>
                    {reg.checked_in ? (
                      <span className="badge badge-success">Attended</span>
                    ) : (
                      <span className="badge badge-primary">Pass Active</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
