import { X, Award, Printer, Calendar, CheckCircle2 } from 'lucide-react'
import type { UserProfile, EventRegistrationItem } from '../types'

interface AttendanceSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile | null
  registrations: EventRegistrationItem[]
}

export default function AttendanceSummaryModal({
  isOpen,
  onClose,
  user,
  registrations,
}: AttendanceSummaryModalProps) {
  if (!isOpen) return null

  const attendedEvents = registrations.filter((r) => r.checked_in)
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  function handlePrint() {
    window.print()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card modal-certificate"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header no-print">
          <div className="modal-title-wrap">
            <Award size={20} className="modal-icon text-amber" />
            <h2>Attendance Record & Verification</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="certificate-body printable-cert">
          <div className="cert-border-outer">
            <div className="cert-border-inner">
              <div className="cert-header">
                <span className="cert-org">SWAHILIPOT HUB COMMUNITY</span>
                <h1 className="cert-title">Certificate of Attendance</h1>
                <p className="cert-subtitle">Official Activity & Participation Transcript</p>
              </div>

              <div className="cert-statement">
                <p>This document officially certifies that</p>
                <h2 className="cert-recipient">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username}
                </h2>
                <p className="cert-username">Member Username: @{user?.username}</p>
                <p className="cert-desc">
                  has actively participated in and successfully verified entrance check-in
                  for the following community workshops, events, and programs at Swahilipot Hub:
                </p>
              </div>

              <div className="cert-events-list">
                {attendedEvents.length === 0 ? (
                  <p className="cert-empty">
                    No verified attended events recorded yet. Attend an event and get checked in
                    at the entrance to populate your verified transcript!
                  </p>
                ) : (
                  <table className="cert-table">
                    <thead>
                      <tr>
                        <th>Event Title</th>
                        <th>Venue</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendedEvents.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.event_title}</strong>
                          </td>
                          <td>{r.event_venue}</td>
                          <td>
                            <Calendar size={12} />{' '}
                            {new Date(r.event_starts_at).toLocaleDateString()}
                          </td>
                          <td>
                            <span className="cert-verified">
                              <CheckCircle2 size={12} /> Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="cert-footer">
                <div className="cert-signature">
                  <div className="sig-line" />
                  <span>Swahilipot Hub Directorate</span>
                </div>
                <div className="cert-stamp">
                  <span className="stamp-badge">VERIFIED PASS</span>
                  <span className="stamp-date">{today}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions no-print cert-modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handlePrint}
            disabled={attendedEvents.length === 0}
          >
            <Printer size={16} />
            <span>Print Official Transcript</span>
          </button>
        </div>
      </div>
    </div>
  )
}
