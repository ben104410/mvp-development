import { X, Video, ExternalLink } from 'lucide-react'

interface LivestreamModalProps {
  isOpen: boolean
  onClose: () => void
  eventTitle: string
  livestreamUrl: string
}

export default function LivestreamModal({
  isOpen,
  onClose,
  eventTitle,
  livestreamUrl,
}: LivestreamModalProps) {
  if (!isOpen || !livestreamUrl) return null

  // Helper to extract YouTube embed URL if applicable
  function getEmbedUrl(url: string): string | null {
    try {
      if (url.includes('youtube.com/watch')) {
        const v = new URL(url).searchParams.get('v')
        return v ? `https://www.youtube.com/embed/${v}?autoplay=1` : null
      }
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0]
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null
      }
      if (url.includes('youtube.com/live/')) {
        const id = url.split('youtube.com/live/')[1]?.split('?')[0]
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null
      }
    } catch {
      return null
    }
    return null
  }

  const embedUrl = getEmbedUrl(livestreamUrl)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card modal-livestream"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Video size={20} className="modal-icon text-red" />
            <h2>Live Broadcast: {eventTitle}</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="livestream-player-container">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`Livestream for ${eventTitle}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="livestream-iframe"
            />
          ) : (
            <div className="livestream-fallback">
              <Video size={48} className="livestream-fallback-icon" />
              <h3>External Livestream Stream</h3>
              <p>
                This event's broadcast is hosted on an external platform. Click
                below to open the player.
              </p>
              <a
                href={livestreamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <span>Launch Stream</span>
                <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>

        <div className="livestream-footer">
          <span className="live-indicator">
            <span className="live-dot" /> LIVE AT SWAHILIPOT HUB
          </span>
          <a
            href={livestreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-text-link"
          >
            <span>Open in new tab</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  )
}
