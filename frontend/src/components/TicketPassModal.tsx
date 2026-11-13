import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, CheckCircle, Clock, Copy, Check, Calendar, MapPin, User } from 'lucide-react'
import type { EventRegistrationItem } from '../types'

interface TicketPassModalProps {
  registration: EventRegistrationItem | null
  isOpen: boolean
  onClose: () => void
  username?: string
}

export default function TicketPassModal({
  registration,
  isOpen,
  onClose,
  username,
}: TicketPassModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !registration) return null

  const date = new Date(registration.event_starts_at)
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

  function handleCopy() {
    if (!registration) return
    navigator.clipboard.writeText(registration.qr_token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card modal-ticket-pass"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pass-modal-header">
          <span className="pass-brand">Swahilipot Hub • Official Pass</span>
          <button type="button" className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="pass-modal-body">
          <div className="pass-status-badge">
            {registration.checked_in ? (
              <span className="badge badge-success">
                <CheckCircle size={14} /> Checked In
              </span>
            ) : (
              <span className="badge badge-primary">
                <Clock size={14} /> Valid / Active Pass
              </span>
            )}
          </div>

          <h2 className="pass-modal-title">{registration.event_title}</h2>

          <div className="pass-details-row">
            <div className="pass-detail">
              <Calendar size={14} />
              <span>
                {formattedDate} • {formattedTime}
              </span>
            </div>
            <div className="pass-detail">
              <MapPin size={14} />
              <span>{registration.event_venue}</span>
            </div>
            {username && (
              <div className="pass-detail">
                <User size={14} />
                <span>Attendee: {username}</span>
              </div>
            )}
          </div>

          <div className="pass-qr-display">
            <QRCodeSVG
              value={registration.qr_token}
              size={180}
              level="H"
              includeMargin={true}
            />
            <span className="pass-qr-instruction">
              Scan this code at the Swahilipot Hub entrance
            </span>
          </div>

          <div className="pass-token-copy-box">
            <span className="pass-token-text">{registration.qr_token}</span>
            <button
              type="button"
              className="btn-copy-sm"
              onClick={handleCopy}
              title="Copy UUID token"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
