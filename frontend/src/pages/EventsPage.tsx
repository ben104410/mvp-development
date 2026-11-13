import { useState, useEffect } from 'react'
import { Search, Plus, QrCode, Sparkles } from 'lucide-react'
import type { EventItem, EventRegistrationItem, UserProfile } from '../types'
import api from '../api'
import EventCard from '../components/EventCard'
import CreateEventModal from '../components/CreateEventModal'
import QRScannerModal from '../components/QRScannerModal'

interface EventsPageProps {
  user: UserProfile | null
}

export default function EventsPage({ user }: EventsPageProps) {
  const [events, setEvents] = useState<EventItem[]>([])
  const [myRegistrations, setMyRegistrations] = useState<EventRegistrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isScanOpen, setIsScanOpen] = useState(false)

  const isOrganizer = Boolean(
    user?.is_superuser ||
      user?.groups?.some((g) => ['organizer', 'admin'].includes(g)),
  )

  async function fetchData() {
    setLoading(true)
    try {
      const [eventsRes, regsRes] = await Promise.all([
        api.get<EventItem[]>('/events/'),
        api.get<EventRegistrationItem[]>('/mine/').catch(() => ({ data: [] })),
      ])
      setEvents(eventsRes.data)
      setMyRegistrations(regsRes.data)
    } catch {
      // Handled silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const registeredEventIds = new Set(
    myRegistrations
      .filter((r) => r.status === 'registered')
      .map((r) => r.event),
  )

  const filteredEvents = events.filter((ev) => {
    const q = search.toLowerCase()
    return (
      ev.title.toLowerCase().includes(q) ||
      ev.venue.toLowerCase().includes(q) ||
      ev.description.toLowerCase().includes(q)
    )
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="page-sub">Community Hub</span>
          <h1 className="page-title">Explore Events & Activities</h1>
          <p className="page-desc">
            Discover workshops, hackathons, and gatherings at Swahilipot Hub.
          </p>
        </div>

        {isOrganizer && (
          <div className="header-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setIsScanOpen(true)}
            >
              <QrCode size={18} />
              <span>Scan Check-In</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={18} />
              <span>Create Event</span>
            </button>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by event title, venue, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state">
          <Sparkles size={40} className="empty-icon" />
          <h3>No events found</h3>
          <p>
            {search
              ? 'Try adjusting your search terms.'
              : isOrganizer
                ? 'Get started by creating your first event!'
                : 'Check back soon for new community activities.'}
          </p>
          {isOrganizer && !search && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={18} /> Create First Event
            </button>
          )}
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isRegistered={registeredEventIds.has(event.id)}
              user={user}
              onRegisteredSuccess={fetchData}
            />
          ))}
        </div>
      )}

      {isOrganizer && (
        <>
          <CreateEventModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onCreated={fetchData}
          />
          <QRScannerModal
            isOpen={isScanOpen}
            onClose={() => setIsScanOpen(false)}
            onSuccess={fetchData}
          />
        </>
      )}
    </div>
  )
}
