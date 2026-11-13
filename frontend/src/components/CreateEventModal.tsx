import { useState, type FormEvent, type ChangeEvent } from 'react'
import { X, CalendarPlus } from 'lucide-react'
import api from '../api'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onCreated,
}: CreateEventModalProps) {
  const [form, setForm] = useState({
    title: '',
    venue: '',
    starts_at: '',
    ends_at: '',
    capacity: '',
    livestream_url: '',
    description: '',
    status: 'published',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      }

      await api.post('/events/', payload)
      onCreated()
      onClose()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: unknown } }).response
        if (typeof res?.data === 'object' && res.data) {
          setError(
            Object.entries(res.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
              .join(' | '),
          )
        } else {
          setError('Failed to create event. Verify fields.')
        }
      } else {
        setError('Network error.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <CalendarPlus size={20} className="modal-icon" />
            <h2>Create New Event</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label htmlFor="ev-title">Title *</label>
          <input
            id="ev-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Swahili Tech Meetup 2026"
            required
          />

          <div className="form-row">
            <div className="form-col">
              <label htmlFor="ev-venue">Venue *</label>
              <input
                id="ev-venue"
                name="venue"
                value={form.venue}
                onChange={handleChange}
                placeholder="e.g. Swahilipot Amphitheatre"
                required
              />
            </div>
            <div className="form-col">
              <label htmlFor="ev-capacity">Capacity</label>
              <input
                id="ev-capacity"
                name="capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={handleChange}
                placeholder="e.g. 150"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label htmlFor="ev-start">Starts At *</label>
              <input
                id="ev-start"
                name="starts_at"
                type="datetime-local"
                value={form.starts_at}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-col">
              <label htmlFor="ev-end">Ends At *</label>
              <input
                id="ev-end"
                name="ends_at"
                type="datetime-local"
                value={form.ends_at}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <label htmlFor="ev-status">Status</label>
          <select
            id="ev-status"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <label htmlFor="ev-livestream">Livestream URL (Optional)</label>
          <input
            id="ev-livestream"
            name="livestream_url"
            type="url"
            value={form.livestream_url}
            onChange={handleChange}
            placeholder="https://youtube.com/live/..."
          />

          <label htmlFor="ev-desc">Description *</label>
          <textarea
            id="ev-desc"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="Event details, schedule, requirements..."
            required
          />

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
