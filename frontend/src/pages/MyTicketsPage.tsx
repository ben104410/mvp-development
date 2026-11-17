import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  Ticket,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Copy,
  Check,
  MessageSquare,
  Printer,
  Maximize2,
  WifiOff,
  Search,
} from 'lucide-react'
import type { EventRegistrationItem } from '../types'
import api from '../api'
import { useToast } from '../components/Toast'
import TicketPassModal from '../components/TicketPassModal'

export default function MyTicketsPage() {
  const { showToast } = useToast()
  const [registrations, setRegistrations] = useState<EventRegistrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [selectedPass, setSelectedPass] = useState<EventRegistrationItem | null>(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'checked'>('all')

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await api.get<EventRegistrationItem[]>('/mine/')
        setRegistrations(res.data)
        localStorage.setItem(
          'swahilipot_cached_tickets',
          JSON.stringify(res.data),
        )
        setIsOffline(false)
      } catch {
        const cached = localStorage.getItem('swahilipot_cached_tickets')
        if (cached) {
          try {
            setRegistrations(JSON.parse(cached))
            setIsOffline(true)
          } catch {
            // Handled silently
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()

    const handleOnline = () => {
      setIsOffline(false)
      fetchTickets()
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  function handleCopy(token: string) {
    navigator.clipboard.writeText(token)
    setCopiedToken(token)
    showToast('Ticket QR token copied to clipboard!', 'info')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  function handlePrint() {
    window.print()
  }

  function getDaysRemaining(dateString: string) {
    const diff = new Date(dateString).getTime() - Date.now()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return 'Event concluded'
    if (days === 0) return 'Happening today!'
    if (days === 1) return 'Tomorrow'
    return `In ${days} days`
  }

  const filteredRegistrations = registrations.filter((reg) => {
    const q = search.toLowerCase()
    const matchesSearch =
      reg.event_title.toLowerCase().includes(q) ||
      reg.event_venue.toLowerCase().includes(q)

    if (!matchesSearch) return false

    if (statusFilter === 'active' && reg.checked_in) return false
    if (statusFilter === 'checked' && !reg.checked_in) return false

    return true
  })

  return (
    <div className="page-container printable-area">
      <div className="page-header no-print">
        <div>
          <span className="page-sub">Verified Passes</span>
          <h1 className="page-title">My Event Tickets</h1>
          <p className="page-desc">
            Present your QR code ticket at the entrance for instant check-in.
          </p>
        </div>

        {registrations.length > 0 && (
          <button
            type="button"
            className="btn-outline"
            onClick={handlePrint}
            title="Print or Save as PDF"
          >
            <Printer size={17} />
            <span>Print Passes</span>
          </button>
        )}
      </div>

      {isOffline && (
        <div className="offline-cached-banner no-print">
          <WifiOff size={18} className="offline-icon" />
          <div className="offline-text">
            <strong>Offline Mode Active</strong>
            <p>
              Displaying passes cached on your device. Entrance scanners can still
              validate these QR codes without active mobile data.
            </p>
          </div>
        </div>
      )}

      {registrations.length > 0 && (
        <div className="tickets-controls-bar no-print">
          <div className="search-box ticket-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search my tickets by event or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="time-filters">
            <button
              type="button"
              className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Passes ({registrations.length})
            </button>
            <button
              type="button"
              className={`filter-chip ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Active Passes ({registrations.filter((r) => !r.checked_in).length})
            </button>
            <button
              type="button"
              className={`filter-chip ${statusFilter === 'checked' ? 'active' : ''}`}
              onClick={() => setStatusFilter('checked')}
            >
              Checked In ({registrations.filter((r) => r.checked_in).length})
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your tickets...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="empty-state">
          <Ticket size={42} className="empty-icon" />
          <h3>No tickets yet</h3>
          <p>You have not registered for any upcoming events.</p>
          <Link to="/events" className="btn-primary">
            Explore Events
          </Link>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="empty-state">
          <Ticket size={42} className="empty-icon" />
          <h3>No matching tickets</h3>
          <p>No tickets match your filter criteria.</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="tickets-list">
          {filteredRegistrations.map((reg) => {
            const date = new Date(reg.event_starts_at)
            const formattedDate = date.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            const formattedTime = date.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
            const countdown = getDaysRemaining(reg.event_starts_at)

            return (
              <div key={reg.id} className="ticket-card">
                <div className="ticket-main">
                  <div className="ticket-status-row">
                    <div className="ticket-badges">
                      {reg.checked_in ? (
                        <span className="badge badge-success">
                          <CheckCircle size={14} /> Checked In
                        </span>
                      ) : (
                        <span className="badge badge-primary">
                          <Clock size={14} /> Active Pass
                        </span>
                      )}
                      <span className="countdown-pill">{countdown}</span>
                    </div>
                    <span className="ticket-id">#{reg.id}</span>
                  </div>

                  <h3 className="ticket-event-title">{reg.event_title}</h3>

                  <div className="ticket-details">
                    <div className="detail-item">
                      <Calendar size={15} />
                      <span>
                        {formattedDate} at {formattedTime}
                      </span>
                    </div>
                    <div className="detail-item">
                      <MapPin size={15} />
                      <span>{reg.event_venue}</span>
                    </div>
                  </div>

                  <div className="ticket-footer-actions no-print">
                    <Link
                      to={`/feedback?event=${reg.event}`}
                      className="btn-text-link"
                    >
                      <MessageSquare size={14} />
                      <span>Leave Feedback</span>
                    </Link>
                  </div>
                </div>

                <div className="ticket-divider">
                  <div className="punch punch-top" />
                  <div className="dashed-line" />
                  <div className="punch punch-bottom" />
                </div>

                <div className="ticket-qr-section">
                  <div className="qr-wrapper">
                    <QRCodeSVG
                      value={reg.qr_token}
                      size={120}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <span className="qr-caption">Scan at Entrance</span>

                  <div className="qr-actions-row no-print">
                    <button
                      type="button"
                      className="btn-copy-token"
                      onClick={() => handleCopy(reg.qr_token)}
                      title="Copy QR token string"
                    >
                      {copiedToken === reg.qr_token ? (
                        <>
                          <Check size={13} /> <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> <span>Copy Code</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn-enlarge-pass"
                      onClick={() => setSelectedPass(reg)}
                      title="Enlarge pass for scanning"
                    >
                      <Maximize2 size={13} />
                      <span>Full Pass</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TicketPassModal
        registration={selectedPass}
        isOpen={Boolean(selectedPass)}
        onClose={() => setSelectedPass(null)}
      />
    </div>
  )
}
