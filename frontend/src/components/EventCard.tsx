import { useState } from 'react'
import { Calendar, MapPin, Users, Video, CheckCircle2 } from 'lucide-react'
import type { EventItem, UserProfile } from '../types'
import api from '../api'

interface EventCardProps {
  event: EventItem
  isRegistered: boolean
  user: UserProfile | null
  onRegisteredSuccess: () => void
  onViewDetails?: (event: EventItem) => void
}

export default function EventCard({
  event,
  isRegistered,
  user,
  onRegisteredSuccess,
  onViewDetails,
}: EventCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isOrganizer = Boolean(
    user?.is_superuser ||
      user?.groups?.some((g) => ['organizer', 'admin'].includes(g)),
  )

  const startDate = new Date(event.starts_at)
  const endDate = new Date(event.ends_at)
  const formattedDate = startDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const formattedTime = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

  async function handleRegister(e: React.MouseEvent) {
    e.stopPropagation()
    setError('')
    setLoading(true)
    try {
      await api.post('/register/', { event_id: event.id })
      onRegisteredSuccess()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: unknown } }).response
        if (typeof res?.data === 'string') {
          setError(res.data)
        } else if (Array.isArray(res?.data)) {
          setError(res.data.join(', '))
        } else {
          setError('Could not complete registration. Check event capacity.')
        }
      } else {
        setError('Network error. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <article
      className="event-card interactive-card"
      onClick={() => onViewDetails?.(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onViewDetails?.(event)
        }
      }}
    >
      <div className="event-card-header">
        <div className="event-date-badge">
          <span className="month">
            {startDate.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
          </span>
          <span className="day">{startDate.getDate()}</span>
        </div>
        <div className="event-header-info">
          <div className="status-row">
            <span className={`badge badge-${event.status}`}>{event.status}</span>
            {event.capacity && (
              <span className="capacity-tag">
                <Users size={13} /> Max {event.capacity}
              </span>
            )}
          </div>
          <h3 className="event-title">{event.title}</h3>
        </div>
      </div>

      <p className="event-description">{event.description}</p>

      <div className="event-meta">
        <div className="meta-item">
          <Calendar size={15} />
          <span>
            {formattedDate} • {formattedTime}
          </span>
        </div>
        <div className="meta-item">
          <MapPin size={15} />
          <span>{event.venue}</span>
        </div>
        {event.livestream_url && (
          <div className="meta-item">
            <Video size={15} />
            <a
              href={event.livestream_url}
              target="_blank"
              rel="noopener noreferrer"
              className="livestream-link"
              onClick={(e) => e.stopPropagation()}
            >
              Watch Livestream
            </a>
          </div>
        )}
      </div>

      {error && <p className="card-error">{error}</p>}

      <div className="event-card-footer">
        <span className="view-details-hint">Click for details →</span>

        {isRegistered ? (
          <div className="registered-pill">
            <CheckCircle2 size={16} />
            <span>Registered</span>
          </div>
        ) : isOrganizer ? (
          <span className="organizer-note">Organizer Account</span>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={handleRegister}
            disabled={loading || event.status !== 'published'}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        )}
      </div>
    </article>
  )
}
