import { useState } from 'react'
import {
  X,
  Calendar,
  MapPin,
  Users,
  Video,
  CheckCircle2,
  ExternalLink,
  CalendarPlus,
  Share2,
  Check,
} from 'lucide-react'
import type { EventItem, UserProfile } from '../types'
import api from '../api'

interface EventDetailsModalProps {
  event: EventItem | null
  isOpen: boolean
  isRegistered: boolean
  user: UserProfile | null
  onClose: () => void
  onRegisterSuccess: () => void
  onEditRequest?: (event: EventItem) => void
}

export default function EventDetailsModal({
  event,
  isOpen,
  isRegistered,
  user,
  onClose,
  onRegisterSuccess,
  onEditRequest,
}: EventDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  if (!isOpen || !event) return null

  const isOrganizer = Boolean(
    user?.is_superuser ||
      user?.groups?.some((g) => ['organizer', 'admin'].includes(g)),
  )

  const startDate = new Date(event.starts_at)
  const endDate = new Date(event.ends_at)

  // Generate Google Calendar URL
  function formatGCalDate(d: Date) {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGCalDate(startDate)}/${formatGCalDate(endDate)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.venue)}`

  async function handleRegister() {
    if (!event) return
    setError('')
    setLoading(true)
    try {
      await api.post('/register/', { event_id: event.id })
      onRegisterSuccess()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: unknown } }).response
        setError(typeof res?.data === 'string' ? res.data : 'Registration failed.')
      } else {
        setError('Network error.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: `Check out ${event?.title} at Swahilipot Hub!`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-badge-group">
            <span className={`badge badge-${event.status}`}>{event.status}</span>
            <span className="event-creator-badge">By @{event.created_by_username || 'Admin'}</span>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="details-body">
          <h2 className="details-title">{event.title}</h2>

          <div className="details-meta-grid">
            <div className="meta-block">
              <Calendar size={18} className="meta-icon" />
              <div>
                <strong>Date & Time</strong>
                <p>
                  {startDate.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="meta-sub">
                  {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="meta-block">
              <MapPin size={18} className="meta-icon" />
              <div>
                <strong>Location & Venue</strong>
                <p>{event.venue}</p>
                <p className="meta-sub">Swahilipot Hub, Mombasa</p>
              </div>
            </div>

            <div className="meta-block">
              <Users size={18} className="meta-icon" />
              <div>
                <strong>Capacity</strong>
                <p>{event.capacity ? `${event.capacity} maximum attendees` : 'Open attendance'}</p>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>About This Event</h3>
            <p className="details-desc">{event.description}</p>
          </div>

          {event.livestream_url && (
            <div className="livestream-card">
              <Video size={20} className="livestream-icon" />
              <div className="livestream-info">
                <strong>Online Livestream Available</strong>
                <p>Can't make it in person? Tune into the official livestream.</p>
              </div>
              <a
                href={event.livestream_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <span>Watch Stream</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {error && <p className="modal-error">{error}</p>}

          <div className="details-actions">
            <div className="details-aux-actions">
              <a
                href={gcalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                title="Add to Google Calendar"
              >
                <CalendarPlus size={16} />
                <span>Add to Calendar</span>
              </a>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleShare}
                title="Share event link"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                <span>{copied ? 'Link Copied!' : 'Share'}</span>
              </button>
            </div>

            <div className="details-primary-actions">
              {isOrganizer && onEditRequest && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    onClose()
                    onEditRequest(event)
                  }}
                >
                  Edit Event
                </button>
              )}

              {isRegistered ? (
                <div className="registered-pill">
                  <CheckCircle2 size={16} />
                  <span>You're Registered!</span>
                </div>
              ) : isOrganizer ? (
                <span className="organizer-note">Organizers cannot self-register</span>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleRegister}
                  disabled={loading || event.status !== 'published'}
                >
                  {loading ? 'Registering...' : 'Register Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
