import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { X, Edit3, Trash2 } from 'lucide-react'
import type { EventItem } from '../types'
import api from '../api'

interface EditEventModalProps {
  event: EventItem | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

export default function EditEventModal({
  event,
  isOpen,
  onClose,
  onUpdated,
}: EditEventModalProps) {
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
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (event) {
      // Format ISO string to datetime-local format YYYY-MM-DDThh:mm
      const toLocalISO = (iso: string) => {
        try {
          const d = new Date(iso)
          const offset = d.getTimezoneOffset() * 60000
          return new Date(d.getTime() - offset).toISOString().slice(0, 16)
        } catch {
          return ''
        }
      }

      setForm({
        title: event.title,
        venue: event.venue,
        starts_at: toLocalISO(event.starts_at),
        ends_at: toLocalISO(event.ends_at),
        capacity: event.capacity ? String(event.capacity) : '',
        livestream_url: event.livestream_url || '',
        description: event.description,
        status: event.status,
      })
    }
  }, [event])

  if (!isOpen || !event) return null

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!event) return
    setError('')
    setLoading(true)

    try {
      const payload = {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      }

      await api.patch(`/events/${event.id}/`, payload)
      onUpdated()
      onClose()
    } catch {
      setError('Failed to update event. Please verify all inputs.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!event) return
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"? This cannot be undone.`,
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      await api.delete(`/events/${event.id}/`)
      onUpdated()
      onClose()
    } catch {
      setError('Cannot delete event with active attendee registrations.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Edit3 size={20} className="modal-icon" />
            <h2>Edit Event Details</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label htmlFor="edit-title">Title *</label>
          <input
            id="edit-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <div className="form-row">
            <div className="form-col">
              <label htmlFor="edit-venue">Venue *</label>
              <input
                id="edit-venue"
                name="venue"
                value={form.venue}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-col">
              <label htmlFor="edit-capacity">Capacity</label>
              <input
                id="edit-capacity"
                name="capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label htmlFor="edit-start">Starts At *</label>
              <input
                id="edit-start"
                name="starts_at"
                type="datetime-local"
                value={form.starts_at}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-col">
              <label htmlFor="edit-end">Ends At *</label>
              <input
                id="edit-end"
                name="ends_at"
                type="datetime-local"
                value={form.ends_at}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <label htmlFor="edit-status">Event Status</label>
          <select
            id="edit-status"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <label htmlFor="edit-livestream">Livestream URL</label>
          <input
            id="edit-livestream"
            name="livestream_url"
            type="url"
            value={form.livestream_url}
            onChange={handleChange}
          />

          <label htmlFor="edit-desc">Description *</label>
          <textarea
            id="edit-desc"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            required
          />

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions-split">
            <button
              type="button"
              className="btn-danger-outline"
              onClick={handleDelete}
              disabled={deleting || loading}
            >
              <Trash2 size={16} />
              <span>{deleting ? 'Deleting...' : 'Delete'}</span>
            </button>

            <div className="modal-actions-right">
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
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
