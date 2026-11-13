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
} from 'lucide-react'
import type { EventRegistrationItem } from '../types'
import api from '../api'
import { useToast } from '../components/Toast'

export default function MyTicketsPage() {
  const { showToast } = useToast()
  const [registrations, setRegistrations] = useState<EventRegistrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await api.get<EventRegistrationItem[]>('/mine/')
        setRegistrations(res.data)
      } catch {
        // Handled silently
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
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
      ) : (
        <div className="tickets-list">
          {registrations.map((reg) => {
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

                  <button
                    type="button"
                    className="btn-copy-token no-print"
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
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
