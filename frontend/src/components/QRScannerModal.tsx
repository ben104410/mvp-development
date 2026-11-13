import { useState, type FormEvent } from 'react'
import { X, QrCode, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../api'

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ScanResult {
  attendee_username: string
  event_title: string
  checked_in_at: string
  method: string
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onSuccess,
}: QRScannerModalProps) {
  const [qrToken, setQrToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)

  if (!isOpen) return null

  async function handleScan(e: FormEvent) {
    e.preventDefault()
    if (!qrToken.trim()) return

    setError('')
    setResult(null)
    setLoading(true)

    try {
      const response = await api.post<ScanResult>('/check-ins/scan/', {
        qr_token: qrToken.trim(),
      })
      setResult(response.data)
      setQrToken('')
      onSuccess()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: unknown } }).response
        if (typeof res?.data === 'string') {
          setError(res.data)
        } else if (Array.isArray(res?.data)) {
          setError(res.data.join(', '))
        } else {
          setError('Invalid or expired ticket. Check-in rejected.')
        }
      } else {
        setError('Network error. Check connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError('')
    setQrToken('')
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <QrCode size={20} className="modal-icon" />
            <h2>Attendee Ticket Check-In</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="scanner-hint">
            Scan attendee QR code or paste their unique ticket token below:
          </p>

          <form onSubmit={handleScan} className="scanner-form">
            <label htmlFor="token-input">QR Token UUID</label>
            <input
              id="token-input"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              autoFocus
              required
            />

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !qrToken.trim()}
            >
              {loading ? 'Verifying...' : 'Check In Attendee'}
            </button>
          </form>

          {result && (
            <div className="scan-success-card">
              <CheckCircle2 size={32} className="success-icon" />
              <div className="success-details">
                <h4>Check-In Successful!</h4>
                <p>
                  <strong>Attendee:</strong> {result.attendee_username}
                </p>
                <p>
                  <strong>Event:</strong> {result.event_title}
                </p>
                <p className="scan-time">
                  {new Date(result.checked_in_at).toLocaleTimeString()}
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
              >
                Scan Next
              </button>
            </div>
          )}

          {error && (
            <div className="scan-error-card">
              <AlertCircle size={22} className="error-icon" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
