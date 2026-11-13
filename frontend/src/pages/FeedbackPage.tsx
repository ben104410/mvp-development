import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Star, MessageSquare, CheckCircle, Calendar, User } from 'lucide-react'
import type { FeedbackItem, EventItem, UserProfile } from '../types'
import api from '../api'

interface FeedbackPageProps {
  user: UserProfile | null
}

export default function FeedbackPage({ user }: FeedbackPageProps) {
  const [searchParams] = useSearchParams()
  const preselectedEventId = searchParams.get('event')

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [selectedEvent, setSelectedEvent] = useState<string>(preselectedEventId || '')
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const isOrganizer = Boolean(
    user?.is_superuser ||
      user?.groups?.some((g) => ['organizer', 'admin'].includes(g)),
  )

  async function fetchData() {
    setLoading(true)
    try {
      const [fbRes, evRes] = await Promise.all([
        api.get<FeedbackItem[]>('/feedback/'),
        api.get<EventItem[]>('/events/').catch(() => ({ data: [] })),
      ])
      setFeedbacks(fbRes.data)
      setEvents(evRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      await api.post('/feedback/', {
        event: selectedEvent ? Number(selectedEvent) : null,
        rating,
        comments,
      })
      setSuccessMsg('Thank you! Your feedback has been recorded.')
      setComments('')
      fetchData()
    } catch {
      setErrorMsg('Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="page-sub">Community Voice</span>
          <h1 className="page-title">Event & Hub Feedback</h1>
          <p className="page-desc">
            Help us improve our community events, workshops, and facilities.
          </p>
        </div>
      </div>

      <div className="feedback-layout">
        {/* Feedback Form Card */}
        <div className="feedback-form-card">
          <h2>
            <MessageSquare size={20} />
            <span>Share Your Experience</span>
          </h2>

          {successMsg && (
            <div className="alert alert-success">
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="feedback-form">
            <label htmlFor="fb-event">Select Event (Optional)</label>
            <select
              id="fb-event"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">General Platform / Hub Feedback</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>

            <label>Rating (1 to 5 Stars)</label>
            <div className="stars-picker">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled =
                  hoverRating !== null ? star <= hoverRating : star <= rating
                return (
                  <button
                    type="button"
                    key={star}
                    className={`star-btn ${filled ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    aria-label={`${star} star`}
                  >
                    <Star size={28} />
                  </button>
                )
              })}
              <span className="rating-label">{rating} of 5 Stars</span>
            </div>

            <label htmlFor="fb-comments">Comments & Suggestions *</label>
            <textarea
              id="fb-comments"
              rows={4}
              required
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="What went well? What can we do better next time?"
            />

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !comments.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>

        {/* Feedback History Card */}
        <div className="feedback-history-card">
          <h2>
            <span>{isOrganizer ? 'All Feedback Received' : 'My Previous Feedback'}</span>
            <span className="count-pill">{feedbacks.length}</span>
          </h2>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading feedback...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="empty-state-mini">
              <p>No feedback recorded yet.</p>
            </div>
          ) : (
            <div className="feedback-list">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="feedback-item-card">
                  <div className="fb-item-header">
                    <div className="fb-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= fb.rating ? 'star-filled' : 'star-empty'}
                        />
                      ))}
                    </div>
                    <span className="fb-date">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="fb-text">"{fb.comments}"</p>

                  <div className="fb-meta">
                    {fb.event_title && (
                      <span className="fb-event-tag">
                        <Calendar size={12} /> {fb.event_title}
                      </span>
                    )}
                    {isOrganizer && (
                      <span className="fb-user-tag">
                        <User size={12} /> {fb.username}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
