import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  QrCode,
  Sparkles,
  Compass,
  LayoutGrid,
  Calendar,
  RotateCcw,
  MapPin,
  ArrowUpDown,
} from 'lucide-react'
import type { EventItem, EventRegistrationItem, UserProfile } from '../types'
import { isUserAdminOrOrganizer } from '../types'
import api from '../api'
import EventCard from '../components/EventCard'
import CreateEventModal from '../components/CreateEventModal'
import QRScannerModal from '../components/QRScannerModal'
import EventDetailsModal from '../components/EventDetailsModal'
import EditEventModal from '../components/EditEventModal'
import EventCalendarView from '../components/EventCalendarView'
import { useToast } from '../components/Toast'

interface EventsPageProps {
  user: UserProfile | null
}

export default function EventsPage({ user }: EventsPageProps) {
  const { showToast } = useToast()
  const [events, setEvents] = useState<EventItem[]>([])
  const [myRegistrations, setMyRegistrations] = useState<EventRegistrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [venueFilter, setVenueFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'title-asc' | 'capacity-desc'>('date-asc')
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid')

  const categories = [
    { id: 'all', label: 'All Themes' },
    { id: 'tech', label: '💻 Tech & AI', keywords: ['tech', 'code', 'python', 'software', 'ai', 'data', 'web', 'dev'] },
    { id: 'creative', label: '🎨 Arts & Creative', keywords: ['art', 'music', 'dance', 'film', 'theatre', 'creative', 'culture'] },
    { id: 'hackathon', label: '🚀 Hackathons', keywords: ['hack', 'hackathon', 'competition', 'challenge'] },
    { id: 'workshop', label: '🎓 Workshops', keywords: ['workshop', 'training', 'masterclass', 'bootcamp', 'session'] },
    { id: 'community', label: '🤝 Community', keywords: ['meetup', 'gathering', 'community', 'youth', 'forum'] },
  ]

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isScanOpen, setIsScanOpen] = useState(false)
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<EventItem | null>(null)
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<EventItem | null>(null)

  const isOrganizer = isUserAdminOrOrganizer(user)

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

  const venues = Array.from(
    new Set(events.map((e) => e.venue?.trim()).filter(Boolean)),
  ).sort()

  const hasActiveFilters =
    Boolean(search) ||
    timeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    venueFilter !== 'all' ||
    sortBy !== 'date-asc'

  function resetFilters() {
    setSearch('')
    setTimeFilter('all')
    setCategoryFilter('all')
    setVenueFilter('all')
    setSortBy('date-asc')
  }

  const now = new Date().getTime()
  const filteredEvents = events
    .filter((ev) => {
      const q = search.toLowerCase()
      const matchesSearch =
        ev.title.toLowerCase().includes(q) ||
        ev.venue.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q)

      if (!matchesSearch) return false

      const endMs = new Date(ev.ends_at).getTime()
      if (timeFilter === 'upcoming') {
        return endMs >= now
      }
      if (timeFilter === 'past') {
        if (endMs >= now) return false
      }

      if (categoryFilter !== 'all') {
        const cat = categories.find((c) => c.id === categoryFilter)
        if (cat?.keywords) {
          const text = `${ev.title} ${ev.description} ${ev.venue}`.toLowerCase()
          const matches = cat.keywords.some((k) => text.includes(k))
          if (!matches) return false
        }
      }

      if (venueFilter !== 'all' && ev.venue?.trim() !== venueFilter) {
        return false
      }

      return true
    })

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'date-asc') {
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    }
    if (sortBy === 'date-desc') {
      return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
    }
    if (sortBy === 'title-asc') {
      return a.title.localeCompare(b.title)
    }
    if (sortBy === 'capacity-desc') {
      return (b.capacity ?? 0) - (a.capacity ?? 0)
    }
    return 0
  })

  return (
    <div className="page-container">
      {/* Hero Welcome Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <div className="hero-pill">
            <Compass size={14} />
            <span>Swahilipot Smart Hub • Technology, Youth & Arts</span>
          </div>
          <h1 className="hero-headline">
            Where Community, Innovation & Culture Converge
          </h1>
          <p className="hero-subtext">
            Discover upcoming workshops, hackathons, open mic nights, and community
            meetups. Register in seconds and access your verified digital passes.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-num">{events.length}</span>
              <span className="stat-desc">Community Events</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">{myRegistrations.length}</span>
              <span className="stat-desc">My Passes Booked</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">Free</span>
              <span className="stat-desc">Community Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Events Header */}
      <div className="page-header">
        <div>
          <div className="page-header-title-row">
            <span className="page-sub">Event Directory</span>
            {isOrganizer && (
              <span className="role-tag-header">Admin Access Enabled</span>
            )}
          </div>
          <h2 className="section-heading">Browse All Activities</h2>
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
              <span>Add Event</span>
            </button>
          </div>
        )}
      </div>

      {/* Search and Time Filters */}
      <div className="directory-filters">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, venue, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="time-filters">
          <button
            type="button"
            className={`filter-chip ${timeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTimeFilter('all')}
          >
            All Events ({events.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${timeFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setTimeFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`filter-chip ${timeFilter === 'past' ? 'active' : ''}`}
            onClick={() => setTimeFilter('past')}
          >
            Past Events
          </button>

          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid card view"
            >
              <LayoutGrid size={15} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Month calendar view"
            >
              <Calendar size={15} />
              <span>Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Theme Chips */}
      <div className="category-chips-bar">
        {categories.map((cat) => (
          <button
            type="button"
            key={cat.id}
            className={`cat-chip ${categoryFilter === cat.id ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Refinement & Sorting Strip */}
      <div className="events-refinement-bar">
        <div className="refinement-controls">
          <div className="refinement-item">
            <MapPin size={14} className="refinement-icon" />
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="refinement-select"
              aria-label="Filter by venue"
            >
              <option value="all">All Venues</option>
              {venues.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="refinement-item">
            <ArrowUpDown size={14} className="refinement-icon" />
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | 'date-asc'
                    | 'date-desc'
                    | 'title-asc'
                    | 'capacity-desc',
                )
              }
              className="refinement-select"
              aria-label="Sort events by"
            >
              <option value="date-asc">Date: Soonest First</option>
              <option value="date-desc">Date: Latest First</option>
              <option value="title-asc">Alphabetical (A - Z)</option>
              <option value="capacity-desc">Capacity (High to Low)</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn-reset-filters"
              onClick={resetFilters}
              title="Reset all active search and filters"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="refinement-count">
          <span>
            Showing <strong>{sortedEvents.length}</strong> of{' '}
            <strong>{events.length}</strong> events
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading community events...</p>
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="empty-state">
          <Sparkles size={40} className="empty-icon" />
          <h3>No events found</h3>
          <p>
            {search
              ? 'No events match your current search criteria.'
              : timeFilter !== 'all'
                ? `No events found for the "${timeFilter}" filter.`
                : venueFilter !== 'all'
                  ? `No events found at "${venueFilter}".`
                  : isOrganizer
                    ? 'Get started by creating your first community event!'
                    : 'Check back soon for upcoming gatherings.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn-secondary"
              onClick={resetFilters}
              style={{ marginTop: '8px' }}
            >
              <RotateCcw size={15} /> Reset All Filters
            </button>
          )}
          {isOrganizer && !search && !hasActiveFilters && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={18} /> Create Event
            </button>
          )}
        </div>
      ) : viewMode === 'calendar' ? (
        <EventCalendarView
          events={sortedEvents}
          onSelectEvent={(ev) => setSelectedEventForDetails(ev)}
        />
      ) : (
        <div className="events-grid">
          {sortedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isRegistered={registeredEventIds.has(event.id)}
              user={user}
              onRegisteredSuccess={() => {
                fetchData()
                showToast(`🎉 You're registered for "${event.title}"!`)
              }}
              onViewDetails={(ev) => setSelectedEventForDetails(ev)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <EventDetailsModal
        event={selectedEventForDetails}
        isOpen={Boolean(selectedEventForDetails)}
        isRegistered={Boolean(
          selectedEventForDetails && registeredEventIds.has(selectedEventForDetails.id),
        )}
        user={user}
        onClose={() => setSelectedEventForDetails(null)}
        onRegisterSuccess={() => {
          fetchData()
          showToast(`🎉 Registration confirmed for "${selectedEventForDetails?.title}"!`)
          setSelectedEventForDetails(null)
        }}
        onEditRequest={(ev) => setSelectedEventForEdit(ev)}
      />

      {isOrganizer && (
        <>
          <CreateEventModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onCreated={() => {
              fetchData()
              showToast('✨ New event published successfully!')
            }}
          />
          <EditEventModal
            event={selectedEventForEdit}
            isOpen={Boolean(selectedEventForEdit)}
            onClose={() => setSelectedEventForEdit(null)}
            onUpdated={() => {
              fetchData()
              showToast('Event updated successfully!')
            }}
          />
          <QRScannerModal
            isOpen={isScanOpen}
            onClose={() => setIsScanOpen(false)}
            onSuccess={() => {
              fetchData()
              showToast('Check-in recorded!')
            }}
          />
        </>
      )}
    </div>
  )
}
