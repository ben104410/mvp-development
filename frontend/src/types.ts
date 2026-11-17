export interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  groups: string[]
  is_staff?: boolean
  is_superuser: boolean
}

export function isUserAdminOrOrganizer(user: UserProfile | null): boolean {
  if (!user) return false
  if (user.is_superuser || user.is_staff) return true
  const adminGroups = [
    'organizer',
    'admin',
    'administrator',
    'administrators',
    'staff',
    'admins',
    'organizers',
  ]
  return Boolean(
    user.groups?.some((g) => adminGroups.includes(g.toLowerCase())),
  )
}

export interface EventItem {
  id: number
  title: string
  slug: string
  description: string
  venue: string
  starts_at: string
  ends_at: string
  capacity: number | null
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  livestream_url: string
  created_by: number
  created_by_username: string
  created_at: string
  updated_at: string
}

export interface EventRegistrationItem {
  id: number
  event: number
  event_title: string
  event_starts_at: string
  event_venue: string
  status: 'registered' | 'cancelled'
  qr_token: string
  registered_at: string
  checked_in: boolean
}

export interface AnnouncementItem {
  id: number
  title: string
  message: string
  priority: 'normal' | 'important' | 'urgent'
  status: 'draft' | 'published'
  expires_at: string | null
  created_by: number
  author_username: string
  created_at: string
  updated_at: string
}

export interface NewsItem {
  id: number
  title: string
  slug: string
  summary: string
  content: string
  image_url: string
  status: 'draft' | 'published'
  published_at: string | null
  created_by: number
  author_username: string
  created_at: string
  updated_at: string
}

export interface FeedbackItem {
  id: number
  event: number | null
  event_title: string | null
  rating: number
  comments: string
  user: number
  username: string
  created_at: string
}

export interface EventAnalyticsData {
  event_id: number
  event_title: string
  capacity: number | null
  registrations: number
  checked_in: number
  not_checked_in: number
  attendance_rate_percent: number
}
