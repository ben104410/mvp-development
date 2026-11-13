import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, X, ArrowRight } from 'lucide-react'
import type { AnnouncementItem } from '../types'
import api from '../api'

export default function UrgentBanner() {
  const [urgentItem, setUrgentItem] = useState<AnnouncementItem | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('dismissed_urgent_banner') === 'true'
  })

  useEffect(() => {
    if (dismissed) return

    api
      .get<AnnouncementItem[]>('/announcements/')
      .then((res) => {
        const urgent = res.data.find(
          (item) => item.priority === 'urgent' && item.status === 'published',
        )
        if (urgent) {
          setUrgentItem(urgent)
        }
      })
      .catch(() => {})
  }, [dismissed])

  if (!urgentItem || dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem('dismissed_urgent_banner', 'true')
  }

  return (
    <aside className="urgent-banner" aria-label="Urgent community announcement">
      <div className="urgent-banner-inner">
        <div className="urgent-banner-content">
          <span className="urgent-pill">
            <AlertTriangle size={14} /> Urgent
          </span>
          <strong className="urgent-title">{urgentItem.title}</strong>
          <span className="urgent-sep">•</span>
          <span className="urgent-msg">{urgentItem.message}</span>
        </div>

        <div className="urgent-banner-actions">
          <Link to="/announcements" className="urgent-link">
            <span>Read More</span>
            <ArrowRight size={13} />
          </Link>
          <button
            type="button"
            className="urgent-close"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
