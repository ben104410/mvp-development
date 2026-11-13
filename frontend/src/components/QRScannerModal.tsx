import { useState, useEffect, type FormEvent } from 'react'
import { X, QrCode, Camera, CheckCircle2, AlertCircle, Keyboard } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
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
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [qrToken, setQrToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)

  // Process check-in API call
  async function submitCheckIn(token: string) {
    if (!token.trim()) return
    setError('')
    setResult(null)
    setLoading(true)

    try {
      const response = await api.post<ScanResult>('/check-ins/scan/', {
        qr_token: token.trim(),
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

  // Camera scanner setup
  useEffect(() => {
    if (!isOpen || mode !== 'camera' || result) return

    let scanner: Html5QrcodeScanner | null = null
    const timer = setTimeout(() => {
      try {
        scanner = new Html5QrcodeScanner(
          'qr-camera-reader',
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            rememberLastUsedCamera: true,
          },
          false,
        )

        scanner.render(
          (decodedText) => {
            if (decodedText) {
              submitCheckIn(decodedText)
              scanner?.clear().catch(() => {})
            }
          },
          () => {
            // Ignore scan frame misses
          },
        )
      } catch {
        setError('Could not initialize camera. Use manual mode instead.')
      }
    }, 150)

    return () => {
      clearTimeout(timer)
      if (scanner) {
        scanner.clear().catch(() => {})
      }
    }
  }, [isOpen, mode, result])

  if (!isOpen) return null

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault()
    submitCheckIn(qrToken)
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
          {/* Scanner Mode Toggle */}
          <div className="scanner-mode-tabs">
            <button
              type="button"
              className={`scanner-tab-btn ${mode === 'camera' ? 'active' : ''}`}
              onClick={() => {
                setMode('camera')
                handleReset()
              }}
            >
              <Camera size={16} />
              <span>Camera Scanner</span>
            </button>
            <button
              type="button"
              className={`scanner-tab-btn ${mode === 'manual' ? 'active' : ''}`}
              onClick={() => {
                setMode('manual')
                handleReset()
              }}
            >
              <Keyboard size={16} />
              <span>Manual Input</span>
            </button>
          </div>

          {!result && mode === 'camera' && (
            <div className="camera-scan-wrap">
              <div id="qr-camera-reader" />
              <p className="scanner-hint">
                Position the attendee's QR ticket within the camera frame.
              </p>
            </div>
          )}

          {!result && mode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="scanner-form">
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
          )}

          {result && (
            <div className="scan-success-card">
              <CheckCircle2 size={36} className="success-icon" />
              <div className="success-details">
                <h4>Check-In Verified!</h4>
                <p>
                  <strong>Attendee:</strong> {result.attendee_username}
                </p>
                <p>
                  <strong>Event:</strong> {result.event_title}
                </p>
                <p className="scan-time">
                  Recorded at {new Date(result.checked_in_at).toLocaleTimeString()}
                </p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleReset}
              >
                Scan Next Attendee
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
