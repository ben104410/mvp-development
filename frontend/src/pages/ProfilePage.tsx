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
  Award,
  Star,
  QrCode,
  Sparkles,
} from 'lucide-react'
import type { UserProfile, EventRegistrationItem, FeedbackItem } from '../types'
import api from '../api'
import AttendanceSummaryModal from '../components/AttendanceSummaryModal'
import TicketPassModal from '../components/TicketPassModal'

interface ProfilePageProps {
  user: UserProfile | null
  onLogout: () => void
}

export default function ProfilePage({ user, onLogout }: ProfilePageProps) {
  const [registrations, setRegistrations] = useState<EventRegistrationItem[]>([])
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'passes' | 'feedback' | 'badges'>('passes')
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  const [selectedPass, setSelectedPass] = useState<EventRegistrationItem | null>(null)

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

  // Badges logic
  const badges = [
    {
      id: 'member',
      title: 'Community Pioneer',
      desc: 'Registered member of Swahilipot Hub',
      earned: true,
      icon: '🏛️',
    },
    {
      id: 'active',
      title: 'Active Participant',
      desc: 'Attended at least 1 verified event',
      earned: checkedInCount >= 1,
      icon: '🎯',
    },
    {
      id: 'veteran',
      title: 'Hub Champion',
      desc: 'Attended 3 or more workshops & sessions',
      earned: checkedInCount >= 3,
      icon: '🏆',
    },
    {
      id: 'voice',
      title: 'Community Voice',
      desc: 'Submitted feedback to help improve the hub',
      earned: feedbacks.length >= 1,
      icon: '⭐',
    },
  ]

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

        <div className="header-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={() => setIsCertModalOpen(true)}
            title="View official attendance record transcript"
          >
            <Award size={17} />
            <span>Attendance Record</span>
          </button>
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

            <div className="info-item">
              <Sparkles size={16} className="info-icon" />
              <div>
                <span className="info-label">Hub Status</span>
                <span className="info-val">Verified Community Member</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Tabs Column */}
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

          {/* Profile Content Tabs */}
          <div className="profile-activity-card">
            <div className="profile-tabs-header">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'passes' ? 'active' : ''}`}
                onClick={() => setActiveTab('passes')}
              >
                <Ticket size={16} />
                <span>My Passes ({registrations.length})</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
                onClick={() => setActiveTab('feedback')}
              >
                <MessageSquare size={16} />
                <span>My Reviews ({feedbacks.length})</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'badges' ? 'active' : ''}`}
                onClick={() => setActiveTab('badges')}
              >
                <Award size={16} />
                <span>Hub Badges</span>
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading member data...</p>
              </div>
            ) : activeTab === 'passes' ? (
              registrations.length === 0 ? (
                <div className="empty-state-mini">
                  <p>No event passes booked yet.</p>
                </div>
              ) : (
                <div className="activity-list">
                  {registrations.map((reg) => (
                    <div key={reg.id} className="activity-row">
                      <div className="activity-info">
                        <strong>{reg.event_title}</strong>
                        <span className="activity-sub">
                          <Calendar size={12} />{' '}
                          {new Date(reg.event_starts_at).toLocaleDateString()} • {reg.event_venue}
                        </span>
                      </div>

                      <div className="activity-actions">
                        {reg.checked_in ? (
                          <span className="badge badge-success">Attended</span>
                        ) : (
                          <span className="badge badge-primary">Pass Active</span>
                        )}
                        <button
                          type="button"
                          className="btn-icon-table"
                          onClick={() => setSelectedPass(reg)}
                          title="View Digital QR Pass"
                        >
                          <QrCode size={14} />
                          <span>Show QR</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'feedback' ? (
              feedbacks.length === 0 ? (
                <div className="empty-state-mini">
                  <p>You haven't submitted any feedback yet.</p>
                </div>
              ) : (
                <div className="activity-list">
                  {feedbacks.map((fb) => (
                    <div key={fb.id} className="activity-row flex-column">
                      <div className="activity-feedback-top">
                        <div className="fb-stars">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={13}
                              className={s <= fb.rating ? 'star-filled' : 'star-empty'}
                            />
                          ))}
                        </div>
                        <span className="fb-date">
                          {new Date(fb.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="fb-text">"{fb.comments}"</p>
                      {fb.event_title && (
                        <span className="fb-event-tag">
                          <Calendar size={12} /> {fb.event_title}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="badges-grid">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className={`badge-card ${b.earned ? 'earned' : 'locked'}`}
                  >
                    <span className="badge-card-icon">{b.icon}</span>
                    <div className="badge-card-info">
                      <h4>{b.title}</h4>
                      <p>{b.desc}</p>
                      <span className="badge-status-tag">
                        {b.earned ? '✓ Earned' : 'Locked'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AttendanceSummaryModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        user={user}
        registrations={registrations}
      />
      <TicketPassModal
        isOpen={Boolean(selectedPass)}
        onClose={() => setSelectedPass(null)}
        registration={selectedPass}
        username={user?.username}
      />
    </div>
  )
}
