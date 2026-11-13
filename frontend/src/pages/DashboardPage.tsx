import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  Calendar,
  Ticket,
  Bell,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle,
} from 'lucide-react'
import type {
  EventItem,
  EventRegistrationItem,
  AnnouncementItem,
  UserProfile,
} from '../types'
import api from '../api'
import EventDetailsModal from '../components/EventDetailsModal'
import { useToast } from '../components/Toast'

interface DashboardPageProps {
  user: UserProfile | null
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const { showToast } = useToast()
  const [events, setEvents] = useState<EventItem[]>([])
  const [myRegistrations, setMyRegistrations] = useState<EventRegistrationItem[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<EventItem | null>(null)

  const isOrganizer = Boolean(
    user?.is_superuser ||
      user?.groups?.some((g) => ['organizer', 'admin'].includes(g)),
  )

  async function loadHomeData() {
    setLoading(true)
    try {
      const [evRes, regRes, annRes] = await Promise.all([
        api.get<EventItem[]>('/events/').catch(() => ({ data: [] })),
        api.get<EventRegistrationItem[]>('/mine/').catch(() => ({ data: [] })),
        api.get<AnnouncementItem[]>('/announcements/').catch(() => ({ data: [] })),
      ])
      setEvents(evRes.data)
      setMyRegistrations(regRes.data)
      setAnnouncements(annRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHomeData()
  }, [])

  // Time of day greeting
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Find next upcoming registration
  const now = Date.now()
  const nextPass = myRegistrations
    .filter((r) => r.status === 'registered' && new Date(r.event_starts_at).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.event_starts_at).getTime() - new Date(b.event_starts_at).getTime(),
    )[0]

  // Top 3 soonest upcoming published events
  const featuredEvents = events
    .filter((e) => e.status === 'published' && new Date(e.ends_at).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )
    .slice(0, 3)

  // Registered event set
  const registeredEventIds = new Set(
    myRegistrations
      .filter((r) => r.status === 'registered')
      .map((r) => r.event),
  )

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <section className="dashboard-welcome">
        <div className="welcome-text">
          <span className="welcome-sub">Swahilipot Smart Hub</span>
          <h1 className="welcome-heading">
            {greeting}, {user?.first_name || user?.username}!
          </h1>
          <p className="welcome-desc">
            Welcome to your community hub dashboard. Stay connected with the latest
            workshops, track your tickets, and join creative community initiatives.
          </p>
        </div>

        {isOrganizer && (
          <div className="welcome-action">
            <Link to="/organizer" className="btn-primary">
              <ShieldCheck size={18} />
              <span>Organizer Control Center</span>
            </Link>
          </div>
        )}
      </section>

      {/* KPI Stats Strip */}
      <div className="kpi-grid dashboard-kpis">
        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-blue">
            <Calendar size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{events.length}</span>
            <span className="kpi-label">Active Events</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-indigo">
            <Ticket size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{myRegistrations.length}</span>
            <span className="kpi-label">My Event Passes</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-green">
            <Bell size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{announcements.length}</span>
            <span className="kpi-label">Community Notices</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-purple">
            <Sparkles size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-value">Active</span>
            <span className="kpi-label">Hub Status</span>
          </div>
        </div>
      </div>

      {/* Next Up Pass Highlight Card */}
      <div className="next-pass-section">
        {nextPass ? (
          <div className="next-pass-card">
            <div className="pass-highlight-info">
              <div className="pass-tag">
                <Clock size={14} />
                <span>Next Upcoming Event Pass</span>
              </div>
              <h2 className="pass-title">{nextPass.event_title}</h2>
              <div className="pass-meta">
                <div className="pass-meta-item">
                  <Calendar size={15} />
                  <span>
                    {new Date(nextPass.event_starts_at).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(nextPass.event_starts_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="pass-meta-item">
                  <MapPin size={15} />
                  <span>{nextPass.event_venue}</span>
                </div>
              </div>

              <div className="pass-actions">
                <Link to="/tickets" className="btn-primary">
                  <span>View Full Pass</span>
                  <ArrowRight size={16} />
                </Link>
                {nextPass.checked_in && (
                  <span className="badge badge-success">
                    <CheckCircle size={14} /> Checked In
                  </span>
                )}
              </div>
            </div>

            <div className="pass-qr-preview">
              <div className="mini-qr">
                <QRCodeSVG value={nextPass.qr_token} size={100} level="M" />
              </div>
              <span className="qr-sub">Scan at Gate</span>
            </div>
          </div>
        ) : (
          <div className="no-pass-card">
            <div className="no-pass-content">
              <Ticket size={28} className="no-pass-icon" />
              <div>
                <h3>No upcoming passes booked yet</h3>
                <p>
                  Explore upcoming tech meetups, art sessions, and workshops at
                  Swahilipot.
                </p>
              </div>
            </div>
            <Link to="/events" className="btn-outline">
              <span>Find an Event</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>

      {/* Featured Events Section */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <div>
            <h2 className="dashboard-section-title">Upcoming Featured Events</h2>
            <p className="dashboard-section-sub">
              Happening soon at Swahilipot Hub. Reserve your spot before capacity fills.
            </p>
          </div>
          <Link to="/events" className="btn-text-link">
            <span>View All ({events.length})</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading events...</p>
          </div>
        ) : featuredEvents.length === 0 ? (
          <div className="empty-state-mini">
            <p>No upcoming events currently scheduled.</p>
          </div>
        ) : (
          <div className="featured-events-grid">
            {featuredEvents.map((ev) => {
              const startDate = new Date(ev.starts_at)
              const isRegistered = registeredEventIds.has(ev.id)

              return (
                <div
                  key={ev.id}
                  className="featured-card"
                  onClick={() => setSelectedEventForDetails(ev)}
                >
                  <div className="featured-card-top">
                    <span className="date-chip">
                      {startDate.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="venue-chip">{ev.venue}</span>
                  </div>

                  <h3 className="featured-title">{ev.title}</h3>
                  <p className="featured-desc">{ev.description}</p>

                  <div className="featured-footer">
                    <span className="featured-time">
                      {startDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {isRegistered ? (
                      <span className="registered-pill-sm">
                        <CheckCircle size={13} /> Registered
                      </span>
                    ) : (
                      <span className="link-arrow">Details →</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="quick-nav-grid">
        <Link to="/events" className="quick-nav-card card-blue">
          <Calendar size={24} className="qnav-icon" />
          <h3>Event Directory</h3>
          <p>Browse, filter, and register for workshops and tech talks.</p>
          <span className="qnav-arrow">Explore →</span>
        </Link>

        <Link to="/tickets" className="quick-nav-card card-indigo">
          <Ticket size={24} className="qnav-icon" />
          <h3>My Passes</h3>
          <p>Access your digital QR tickets ready for entrance check-in.</p>
          <span className="qnav-arrow">View passes →</span>
        </Link>

        <Link to="/announcements" className="quick-nav-card card-amber">
          <Bell size={24} className="qnav-icon" />
          <h3>Hub Broadcasts</h3>
          <p>Read official community updates, schedules, and stories.</p>
          <span className="qnav-arrow">Read news →</span>
        </Link>

        <Link to="/feedback" className="quick-nav-card card-green">
          <MessageSquare size={24} className="qnav-icon" />
          <h3>Community Feedback</h3>
          <p>Rate events you attended and submit suggestions to the hub.</p>
          <span className="qnav-arrow">Share review →</span>
        </Link>
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEventForDetails}
        isOpen={Boolean(selectedEventForDetails)}
        isRegistered={Boolean(
          selectedEventForDetails && registeredEventIds.has(selectedEventForDetails.id),
        )}
        user={user}
        onClose={() => setSelectedEventForDetails(null)}
        onRegisterSuccess={() => {
          loadHomeData()
          showToast(`🎉 Registration confirmed for "${selectedEventForDetails?.title}"!`)
          setSelectedEventForDetails(null)
        }}
      />
    </div>
  )
}
