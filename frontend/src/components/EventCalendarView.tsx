import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
} from 'lucide-react'
import type { EventItem } from '../types'

interface EventCalendarViewProps {
  events: EventItem[]
  onSelectEvent: (event: EventItem) => void
}

export default function EventCalendarView({
  events,
  onSelectEvent,
}: EventCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string
    events: EventItem[]
  } | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // First day of month (0 = Sun, 1 = Mon, ...)
  const firstDayIndex = new Date(year, month, 1).getDay()
  // Total days in month
  const totalDays = new Date(year, month + 1, 0).getDate()
  // Days in previous month for padding
  const prevMonthDays = new Date(year, month, 0).getDate()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDayEvents(null)
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDayEvents(null)
  }

  function goToToday() {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDayEvents(null)
  }

  // Group events by YYYY-MM-DD
  const eventsByDate = events.reduce<Record<string, EventItem[]>>((acc, ev) => {
    try {
      const d = new Date(ev.starts_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!acc[key]) acc[key] = []
      acc[key].push(ev)
    } catch {
      // Ignore invalid dates
    }
    return acc
  }, {})

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  function handleDateClick(dayNumber: number) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
    const dayEvs = eventsByDate[key] || []
    const d = new Date(year, month, dayNumber)
    setSelectedDayEvents({
      dateStr: d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      events: dayEvs,
    })
  }

  // Generate calendar cells
  const cells: { type: 'prev' | 'current' | 'next'; day: number; key?: string }[] = []

  // Leading days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({ type: 'prev', day: prevMonthDays - i })
  }

  // Days in current month
  for (let d = 1; d <= totalDays; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ type: 'current', day: d, key })
  }

  // Trailing days from next month to fill grid (up to 42 cells = 6 rows)
  const remainingCells = 42 - cells.length
  for (let d = 1; d <= remainingCells; d++) {
    cells.push({ type: 'next', day: d })
  }

  return (
    <div className="calendar-view-container">
      {/* Calendar Header Controls */}
      <div className="cal-header">
        <div className="cal-nav">
          <button type="button" className="cal-nav-btn" onClick={prevMonth} title="Previous Month">
            <ChevronLeft size={18} />
          </button>
          <h2 className="cal-title">
            {monthNames[month]} {year}
          </h2>
          <button type="button" className="cal-nav-btn" onClick={nextMonth} title="Next Month">
            <ChevronRight size={18} />
          </button>
        </div>

        <button type="button" className="cal-today-btn" onClick={goToToday}>
          Today
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="cal-weekdays">
        {weekDays.map((wd) => (
          <span key={wd} className="cal-weekday">
            {wd}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="cal-grid">
        {cells.map((cell, idx) => {
          if (cell.type !== 'current') {
            return (
              <div key={idx} className="cal-cell cal-cell-padded">
                <span className="cal-day-num">{cell.day}</span>
              </div>
            )
          }

          const dayKey = cell.key || ''
          const dayEvents = eventsByDate[dayKey] || []
          const isToday = dayKey === todayKey
          const isSelected = selectedDayEvents && selectedDayEvents.events === dayEvents

          return (
            <div
              key={idx}
              className={`cal-cell cal-cell-current ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
              onClick={() => handleDateClick(cell.day)}
              role="button"
              tabIndex={0}
            >
              <div className="cal-cell-header">
                <span className="cal-day-num">{cell.day}</span>
                {dayEvents.length > 0 && (
                  <span className="cal-count-badge">{dayEvents.length}</span>
                )}
              </div>

              {dayEvents.length > 0 && (
                <div className="cal-event-chips">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span
                      key={ev.id}
                      className="cal-event-chip"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectEvent(ev)
                      }}
                      title={ev.title}
                    >
                      {ev.title}
                    </span>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="cal-more-chip">+{dayEvents.length - 2} more</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected Day Agenda Drawer */}
      {selectedDayEvents && (
        <div className="day-agenda-drawer">
          <div className="agenda-header">
            <div>
              <h3>Schedule for {selectedDayEvents.dateStr}</h3>
              <p>
                {selectedDayEvents.events.length} event
                {selectedDayEvents.events.length === 1 ? '' : 's'} scheduled
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedDayEvents(null)}
            >
              Close
            </button>
          </div>

          {selectedDayEvents.events.length === 0 ? (
            <div className="agenda-empty">
              <CalendarIcon size={24} className="empty-icon" />
              <p>No community events scheduled for this day.</p>
            </div>
          ) : (
            <div className="agenda-list">
              {selectedDayEvents.events.map((ev) => {
                const s = new Date(ev.starts_at)
                return (
                  <div key={ev.id} className="agenda-item">
                    <div className="agenda-time">
                      <Clock size={14} />
                      <span>
                        {s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="agenda-details">
                      <h4>{ev.title}</h4>
                      <p className="agenda-venue">
                        <MapPin size={13} /> {ev.venue}
                      </p>
                      <p className="agenda-desc">{ev.description}</p>
                    </div>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => onSelectEvent(ev)}
                    >
                      <span>View Details</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
