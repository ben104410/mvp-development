import { useState } from 'react'
import {
  X,
  Calendar,
  MapPin,
  Users,
  Video,
  CheckCircle2,
  CalendarPlus,
  Share2,
  Check,
  Play,
  Download,
} from 'lucide-react'
import type { EventItem, UserProfile } from '../types'
import { isUserAdminOrOrganizer } from '../types'
import api from '../api'
import LivestreamModal from './LivestreamModal'

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
  const [isStreamOpen, setIsStreamOpen] = useState(false)

  if (!isOpen || !event) return null

  const isOrganizer = isUserAdminOrOrganizer(user)

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

  function handleDownloadICS() {
    if (!event) return
    const formatICSDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '')
    const start = formatICSDate(startDate)
    const end = formatICSDate(endDate)
    const now = formatICSDate(new Date())

    const clean = (str: string) => str.replace(/\r?\n/g, '\\n').replace(/[,;]/g, ' ')

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Swahilipot Hub//Smart Track//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:swahilipot-event-${event.id}-${Date.now()}@swahilipothub.co.ke`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${clean(event.title)}`,
      `DESCRIPTION:${clean(event.description)}`,
      `LOCATION:${clean(event.venue)}, Swahilipot Hub, Mombasa`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.slug || `swahilipot-event-${event.id}`}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
                <p>Can't make it in person? Tune into the live video stream.</p>
              </div>
              <button
                type="button"
                className="btn-primary btn-stream"
                onClick={() => setIsStreamOpen(true)}
              >
                <Play size={14} />
                <span>Watch Stream</span>
              </button>
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
                <span>Google Cal</span>
              </a>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownloadICS}
                title="Download .ics for Apple Calendar, Outlook, or Phone Calendar"
              >
                <Download size={16} />
                <span>Save .ics</span>
              </button>

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

      <LivestreamModal
        isOpen={isStreamOpen}
        onClose={() => setIsStreamOpen(false)}
        eventTitle={event.title}
        livestreamUrl={event.livestream_url}
      />
    </div>
  )
}
