import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
  ShieldCheck,
  Calendar,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  QrCode,
  Sparkles,
  Download,
  Edit,
} from 'lucide-react'
import type { EventItem, EventAnalyticsData, UserProfile } from '../types'
import api from '../api'
import CreateEventModal from '../components/CreateEventModal'
import QRScannerModal from '../components/QRScannerModal'
import EditEventModal from '../components/EditEventModal'
import { useToast } from '../components/Toast'

interface OrganizerPageProps {
  user: UserProfile | null
}

export default function OrganizerPage({ user }: OrganizerPageProps) {
  const { showToast } = useToast()
  const isOrganizer = Boolean(
    user?.is_superuser ||
      user?.groups?.some((g) => ['organizer', 'admin'].includes(g)),
  )

  const [events, setEvents] = useState<EventItem[]>([])
  const [analyticsMap, setAnalyticsMap] = useState<Record<number, EventAnalyticsData>>({})
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isScanOpen, setIsScanOpen] = useState(false)
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<EventItem | null>(null)

  // Direct quick scan input
  const [quickToken, setQuickToken] = useState('')
  const [quickScanStatus, setQuickScanStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [quickScanning, setQuickScanning] = useState(false)

  const loadOrganizerData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<EventItem[]>('/events/')
      setEvents(res.data)

      // Fetch analytics for each event in parallel
      const analyticsPromises = res.data.map((ev) =>
        api
          .get<EventAnalyticsData>(`/analytics/events/${ev.id}/`)
          .then((r) => ({ id: ev.id, data: r.data }))
          .catch(() => null),
      )

      const results = await Promise.all(analyticsPromises)
      const map: Record<number, EventAnalyticsData> = {}
      results.forEach((item) => {
        if (item) {
          map[item.id] = item.data
        }
      })
      setAnalyticsMap(map)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOrganizer) {
      loadOrganizerData()
    }
  }, [isOrganizer, loadOrganizerData])

  if (!isOrganizer) {
    return <Navigate to="/events" replace />
  }

  // Calculate totals
  const totalEvents = events.length
  const totalRegistrations = Object.values(analyticsMap).reduce(
    (acc, a) => acc + a.registrations,
    0,
  )
  const totalCheckedIn = Object.values(analyticsMap).reduce(
    (acc, a) => acc + a.checked_in,
    0,
  )
  const overallRate = totalRegistrations
    ? Math.round((totalCheckedIn / totalRegistrations) * 100)
    : 0

  function exportCSV() {
    if (events.length === 0) return
    const headers = [
      'Event ID',
      'Event Title',
      'Status',
      'Venue',
      'Starts At',
      'Capacity',
      'Registrations',
      'Checked In',
      'Attendance Rate (%)',
    ]
    const rows = events.map((ev) => {
      const a = analyticsMap[ev.id]
      return [
        ev.id,
        `"${ev.title.replace(/"/g, '""')}"`,
        ev.status,
        `"${ev.venue.replace(/"/g, '""')}"`,
        ev.starts_at,
        ev.capacity ?? 'Unlimited',
        a?.registrations ?? 0,
        a?.checked_in ?? 0,
        a?.attendance_rate_percent ?? 0,
      ]
    })
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `swahilipot-events-report-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Attendance report exported to CSV!')
  }

  async function handleQuickScan(e: React.FormEvent) {
    e.preventDefault()
    if (!quickToken.trim()) return

    setQuickScanning(true)
    setQuickScanStatus(null)

    try {
      const res = await api.post<{ attendee_username: string; event_title: string }>(
        '/check-ins/scan/',
        { qr_token: quickToken.trim() },
      )
      setQuickScanStatus({
        type: 'success',
        message: `Checked in ${res.data.attendee_username} for "${res.data.event_title}"!`,
      })
      setQuickToken('')
      loadOrganizerData()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const r = (err as { response?: { data?: unknown } }).response
        setQuickScanStatus({
          type: 'error',
          message: typeof r?.data === 'string' ? r.data : 'Check-in failed.',
        })
      } else {
        setQuickScanStatus({ type: 'error', message: 'Network error.' })
      }
    } finally {
      setQuickScanning(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="page-sub">Administration & Analytics</span>
          <h1 className="page-title">Organizer Control Center</h1>
          <p className="page-desc">
            Manage events, process attendee check-ins, and track engagement.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={exportCSV}
            disabled={events.length === 0}
            title="Export CSV attendance report"
          >
            <Download size={17} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => setIsScanOpen(true)}
          >
            <QrCode size={18} />
            <span>Scan Ticket</span>
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
      </div>

      {/* KPI Stats */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-blue">
            <Calendar size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{totalEvents}</span>
            <span className="kpi-label">Total Events</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-indigo">
            <Users size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{totalRegistrations}</span>
            <span className="kpi-label">Total Registrations</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-green">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{totalCheckedIn}</span>
            <span className="kpi-label">Attended & Checked In</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-purple">
            <TrendingUp size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{overallRate}%</span>
            <span className="kpi-label">Average Attendance Rate</span>
          </div>
        </div>
      </div>

      {/* Quick Check-In Bar */}
      <div className="quick-scan-card">
        <div className="quick-scan-header">
          <ShieldCheck size={20} className="icon-shield" />
          <div>
            <h3>Express Ticket Scanner</h3>
            <p>Scan barcode / paste QR token to instantly check in an attendee.</p>
          </div>
        </div>

        <form onSubmit={handleQuickScan} className="quick-scan-form">
          <input
            value={quickToken}
            onChange={(e) => setQuickToken(e.target.value)}
            placeholder="Paste attendee UUID token here..."
            required
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={quickScanning || !quickToken.trim()}
          >
            {quickScanning ? 'Validating...' : 'Scan & Check In'}
          </button>
        </form>

        {quickScanStatus && (
          <div className={`scan-alert alert-${quickScanStatus.type}`}>
            {quickScanStatus.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <QrCode size={16} />
            )}
            <span>{quickScanStatus.message}</span>
          </div>
        )}
      </div>

      {/* Event Analytics Table */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>Event Attendance & Capacity Analytics</h2>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Compiling attendance analytics...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={40} className="empty-icon" />
            <h3>No events to analyze</h3>
            <p>Create an event to view real-time registration and check-in stats.</p>
          </div>
        ) : (
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Capacity</th>
                  <th>Registrations</th>
                  <th>Checked In</th>
                  <th>Attendance Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const stat = analyticsMap[ev.id]
                  const regCount = stat?.registrations ?? 0
                  const checkedCount = stat?.checked_in ?? 0
                  const rate = stat?.attendance_rate_percent ?? 0
                  const cap = ev.capacity

                  return (
                    <tr key={ev.id}>
                      <td className="event-name-cell">
                        <strong>{ev.title}</strong>
                      </td>
                      <td>
                        <span className={`badge badge-${ev.status}`}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="date-cell">
                        {new Date(ev.starts_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="venue-cell">{ev.venue}</td>
                      <td>{cap ? cap : 'Unlimited'}</td>
                      <td>
                        <strong>{regCount}</strong>
                        {cap && (
                          <span className="cap-percent">
                            {' '}
                            ({Math.round((regCount / cap) * 100)}%)
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="checked-cell">
                          <CheckCircle2 size={14} /> {checkedCount}
                        </span>
                      </td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                          <span className="progress-label">{rate}%</span>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon-table"
                          onClick={() => setSelectedEventForEdit(ev)}
                          title="Edit Event"
                        >
                          <Edit size={15} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          loadOrganizerData()
          showToast('Event created successfully!')
        }}
      />
      <EditEventModal
        event={selectedEventForEdit}
        isOpen={Boolean(selectedEventForEdit)}
        onClose={() => setSelectedEventForEdit(null)}
        onUpdated={() => {
          loadOrganizerData()
          showToast('Event updated successfully!')
        }}
      />
      <QRScannerModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onSuccess={() => {
          loadOrganizerData()
          showToast('Ticket check-in processed!')
        }}
      />
    </div>
  )
}
