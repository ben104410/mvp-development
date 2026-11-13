import { useState, useEffect } from 'react'
import {
  Bell,
  Newspaper,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
  Plus,
  User,
} from 'lucide-react'
import type { AnnouncementItem, NewsItem, UserProfile } from '../types'
import api from '../api'
import ArticleReaderModal from '../components/ArticleReaderModal'

interface AnnouncementsPageProps {
  user: UserProfile | null
}

export default function AnnouncementsPage({ user }: AnnouncementsPageProps) {
  const [activeTab, setActiveTab] = useState<'announcements' | 'news'>('announcements')
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null)

  // Creation form state
  const [annForm, setAnnForm] = useState({
    title: '',
    message: '',
    priority: 'normal',
    status: 'published',
  })
  const [newsForm, setNewsForm] = useState({
    title: '',
    summary: '',
    content: '',
    image_url: '',
    status: 'published',
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const isOrganizer = Boolean(
    user?.is_superuser ||
      user?.groups?.some((g) => ['organizer', 'admin'].includes(g)),
  )

  async function loadData() {
    setLoading(true)
    try {
      const [annRes, newsRes] = await Promise.all([
        api.get<AnnouncementItem[]>('/announcements/').catch(() => ({ data: [] })),
        api.get<NewsItem[]>('/news/').catch(() => ({ data: [] })),
      ])
      setAnnouncements(annRes.data)
      setNews(newsRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      await api.post('/announcements/', annForm)
      setAnnForm({ title: '', message: '', priority: 'normal', status: 'published' })
      setShowCreateModal(false)
      loadData()
    } catch {
      setError('Failed to create announcement.')
    } finally {
      setCreating(false)
    }
  }

  async function handleCreateNews(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      await api.post('/news/', {
        ...newsForm,
        published_at: new Date().toISOString(),
      })
      setNewsForm({ title: '', summary: '', content: '', image_url: '', status: 'published' })
      setShowCreateModal(false)
      loadData()
    } catch {
      setError('Failed to publish article.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="page-sub">Updates & Stories</span>
          <h1 className="page-title">Community Broadcasts</h1>
          <p className="page-desc">
            Stay informed with announcements and news from Swahilipot Hub.
          </p>
        </div>

        {isOrganizer && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            <span>
              {activeTab === 'announcements' ? 'New Announcement' : 'Publish Article'}
            </span>
          </button>
        )}
      </div>

      <div className="tabs-header">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <Bell size={18} />
          <span>Announcements ({announcements.length})</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          <Newspaper size={18} />
          <span>News & Articles ({news.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading updates...</p>
        </div>
      ) : activeTab === 'announcements' ? (
        announcements.length === 0 ? (
          <div className="empty-state">
            <Bell size={40} className="empty-icon" />
            <h3>No announcements at this time</h3>
            <p>Check back later for community notices.</p>
          </div>
        ) : (
          <div className="announcements-list">
            {announcements.map((item) => (
              <div
                key={item.id}
                className={`announcement-card priority-${item.priority}`}
              >
                <div className="announcement-header">
                  <div className="priority-badge-row">
                    {item.priority === 'urgent' && (
                      <span className="badge badge-urgent">
                        <AlertTriangle size={13} /> Urgent
                      </span>
                    )}
                    {item.priority === 'important' && (
                      <span className="badge badge-important">
                        <Info size={13} /> Important
                      </span>
                    )}
                    {item.priority === 'normal' && (
                      <span className="badge badge-normal">
                        <CheckCircle size={13} /> Notice
                      </span>
                    )}
                    <span className="announcement-date">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="announcement-title">{item.title}</h3>
                </div>

                <p className="announcement-message">{item.message}</p>

                <div className="announcement-footer">
                  <User size={13} />
                  <span>Posted by {item.author_username || 'Admin'}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : news.length === 0 ? (
        <div className="empty-state">
          <Newspaper size={40} className="empty-icon" />
          <h3>No news articles published yet</h3>
          <p>Community stories and articles will be featured here.</p>
        </div>
      ) : (
        <div className="news-grid">
          {news.map((article) => (
            <article
              key={article.id}
              className="news-card interactive-card"
              onClick={() => setSelectedArticle(article)}
              role="button"
              tabIndex={0}
            >
              {article.image_url ? (
                <div className="news-image-wrapper">
                  <img src={article.image_url} alt={article.title} />
                </div>
              ) : (
                <div className="news-image-placeholder">
                  <Newspaper size={36} />
                </div>
              )}
              <div className="news-body">
                <div className="news-meta">
                  <Calendar size={13} />
                  <span>
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString()
                      : new Date(article.created_at).toLocaleDateString()}
                  </span>
                  <span>• By {article.author_username}</span>
                </div>
                <h3 className="news-title">{article.title}</h3>
                <p className="news-summary">{article.summary}</p>
                <span className="read-more-link">Read Full Story →</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>
                {activeTab === 'announcements'
                  ? 'Create Announcement'
                  : 'Publish News Article'}
              </h2>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            {activeTab === 'announcements' ? (
              <form onSubmit={handleCreateAnnouncement} className="modal-form">
                <label>Title</label>
                <input
                  required
                  value={annForm.title}
                  onChange={(e) =>
                    setAnnForm({ ...annForm, title: e.target.value })
                  }
                  placeholder="e.g. Schedule Change for Lab Access"
                />

                <label>Priority</label>
                <select
                  value={annForm.priority}
                  onChange={(e) =>
                    setAnnForm({ ...annForm, priority: e.target.value })
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>

                <label>Message</label>
                <textarea
                  required
                  rows={4}
                  value={annForm.message}
                  onChange={(e) =>
                    setAnnForm({ ...annForm, message: e.target.value })
                  }
                  placeholder="Announcement body..."
                />

                {error && <p className="modal-error">{error}</p>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={creating}
                  >
                    {creating ? 'Posting...' : 'Post Announcement'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateNews} className="modal-form">
                <label>Article Title</label>
                <input
                  required
                  value={newsForm.title}
                  onChange={(e) =>
                    setNewsForm({ ...newsForm, title: e.target.value })
                  }
                  placeholder="e.g. Highlights from Youth Innovation Week"
                />

                <label>Summary</label>
                <input
                  required
                  value={newsForm.summary}
                  onChange={(e) =>
                    setNewsForm({ ...newsForm, summary: e.target.value })
                  }
                  placeholder="Brief 1-2 sentence lead..."
                />

                <label>Image URL (Optional)</label>
                <input
                  type="url"
                  value={newsForm.image_url}
                  onChange={(e) =>
                    setNewsForm({ ...newsForm, image_url: e.target.value })
                  }
                  placeholder="https://example.com/photo.jpg"
                />

                <label>Article Content</label>
                <textarea
                  required
                  rows={5}
                  value={newsForm.content}
                  onChange={(e) =>
                    setNewsForm({ ...newsForm, content: e.target.value })
                  }
                  placeholder="Full article content..."
                />

                {error && <p className="modal-error">{error}</p>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={creating}
                  >
                    {creating ? 'Publishing...' : 'Publish Article'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ArticleReaderModal
        article={selectedArticle}
        isOpen={Boolean(selectedArticle)}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  )
}
