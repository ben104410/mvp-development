import { useState } from 'react'
import { X, Calendar, User, Share2, Check, Newspaper } from 'lucide-react'
import type { NewsItem } from '../types'

interface ArticleReaderModalProps {
  article: NewsItem | null
  isOpen: boolean
  onClose: () => void
}

export default function ArticleReaderModal({
  article,
  isOpen,
  onClose,
}: ArticleReaderModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !article) return null

  function handleShare() {
    if (!article) return
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const pubDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date(article.created_at).toLocaleDateString()

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card modal-article-reader"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="article-reader-meta-top">
            <span className="badge badge-primary">Hub Story</span>
            <span className="article-author">
              <User size={13} /> {article.author_username || 'Staff'}
            </span>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="article-reader-body">
          {article.image_url ? (
            <div className="article-hero-img-wrap">
              <img src={article.image_url} alt={article.title} />
            </div>
          ) : (
            <div className="article-hero-placeholder">
              <Newspaper size={48} />
            </div>
          )}

          <div className="article-header-details">
            <div className="article-date-row">
              <Calendar size={14} />
              <span>{pubDate}</span>
            </div>

            <h1 className="article-full-title">{article.title}</h1>
            <p className="article-lead">{article.summary}</p>
          </div>

          <div className="article-divider" />

          <div className="article-main-text">
            {article.content.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className="article-reader-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleShare}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copied ? 'Link Copied!' : 'Share Story'}</span>
            </button>

            <button type="button" className="btn-primary" onClick={onClose}>
              Done Reading
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
