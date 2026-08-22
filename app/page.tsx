"use client"

import { useState, useEffect, useCallback } from "react"
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  checkHealth,
  type Notification,
} from "./lib/api"

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const PRIORITY_COLOR: Record<string, string> = {
  high:   "bg-red-500",
  normal: "bg-blue-500",
  low:    "bg-gray-400",
}

const CATEGORY_BADGE: Record<string, string> = {
  hr:          "bg-purple-100 text-purple-700",
  recruitment: "bg-blue-100 text-blue-700",
  system:      "bg-orange-100 text-orange-700",
  general:     "bg-gray-100 text-gray-600",
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string, user: string) => void }) {
  const [token, setToken] = useState("")
  const [user, setUser] = useState("alice")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Pre-fill the mock token for easy testing
  const MOCK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZSIsImV4cCI6OTk5OTk5OTk5OX0.Ga5AAHJdVxUFK6l4jQ3cWkfO0bU-JU4SjBMsa1QdPxk"

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!token.trim()) { setError("Paste your JWT token."); return }
    setLoading(true)
    try {
      // Try fetching notifications to verify the token works
      await fetchNotifications(token.trim())
      onLogin(token.trim(), user.trim() || "alice")
    } catch (err: any) {
      if (err.message === "401") setError("Token is invalid or expired.")
      else setError("Could not connect to the backend. Make sure it is running on port 8000.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl">🔔</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">ERP Notification Service</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in with your JWT token</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username (for display)
              </label>
              <input
                value={user}
                onChange={e => setUser(e.target.value)}
                placeholder="alice"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                JWT Token
              </label>
              <textarea
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="eyJhbGci..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 resize-none"
              />
            </div>

            {/* Quick fill button for testing */}
            <button
              type="button"
              onClick={() => setToken(MOCK_TOKEN)}
              className="w-full text-xs text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg py-2 transition-colors bg-blue-50"
            >
              Use mock token (for testing)
            </button>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white text-sm font-medium rounded-lg py-2.5 hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Connecting..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Make sure the backend is running on{" "}
          <code className="bg-gray-100 px-1 rounded">localhost:8000</code>
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE NOTIFICATION FORM (simulates an ERP service calling POST /notifications)
// ─────────────────────────────────────────────────────────────────────────────
function CreateForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [userId, setUserId] = useState("alice")
  const [category, setCategory] = useState("general")
  const [priority, setPriority] = useState("normal")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!title.trim() || !message.trim()) { setError("Title and message are required."); return }
    setLoading(true)
    try {
      await createNotification({ user_id: userId, title, message, category, priority })
      setTitle(""); setMessage("")
      setOpen(false)
      onCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <span>+</span> Simulate ERP event
      </button>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Create notification</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">For user</label>
            <input value={userId} onChange={e => setUserId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-400 bg-white">
              <option value="general">General</option>
              <option value="hr">HR</option>
              <option value="recruitment">Recruitment</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *"
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-400" />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message *"
          rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-400 resize-none" />
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Priority</label>
          <div className="flex gap-2">
            {["low", "normal", "high"].map(p => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                  priority === p
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-gray-900 text-white text-sm font-medium rounded-lg py-2 hover:bg-gray-800 disabled:opacity-50 transition-colors">
          {loading ? "Creating..." : "Create notification"}
        </button>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION CARD
// ─────────────────────────────────────────────────────────────────────────────
function NotifCard({
  notif, token, onRead, onDelete,
}: {
  notif: Notification
  token: string
  onRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [marking, setMarking] = useState(false)
  const [error, setError] = useState("")

  async function handleRead() {
    setMarking(true)
    try { await markAsRead(token, notif.id); onRead(notif.id) }
    catch { setError("Failed to mark as read.") }
    finally { setMarking(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try { await deleteNotification(token, notif.id); onDelete(notif.id) }
    catch (err: any) {
      if (err.message === "403") setError("You can't delete another user's notification.")
      else setError("Failed to delete.")
      setDeleting(false)
    }
  }

  return (
    <div className={`group bg-white border rounded-xl p-4 transition-all ${
      !notif.is_read ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
    }`}>
      <div className="flex gap-3 items-start">

        {/* Priority dot */}
        <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${PRIORITY_COLOR[notif.priority]}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium leading-snug ${notif.is_read ? "text-gray-500" : "text-gray-900"}`}>
              {notif.title}
            </p>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_BADGE[notif.category] ?? CATEGORY_BADGE.general}`}>
              {notif.category}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{timeAgo(notif.created_at)}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notif.is_read && (
                <button onClick={handleRead} disabled={marking}
                  className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 px-2 py-0.5 rounded-md transition-colors disabled:opacity-50">
                  {marking ? "..." : "Mark read"}
                </button>
              )}
              <button onClick={handleDelete} disabled={deleting}
                className="text-xs text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 px-2 py-0.5 rounded-md transition-colors disabled:opacity-50">
                {deleting ? "..." : "Delete"}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ token, user, onLogout }: { token: string; user: string; onLogout: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [markingAll, setMarkingAll] = useState(false)
  const [backendOk, setBackendOk] = useState(true)

  const load = useCallback(async () => {
    try {
      const [notifs, count, health] = await Promise.all([
        fetchNotifications(token, statusFilter || undefined, categoryFilter || undefined),
        fetchUnreadCount(token),
        checkHealth(),
      ])
      setNotifications(notifs)
      setUnread(count)
      setBackendOk(health)
      setError("")
    } catch (err: any) {
      if (err.message === "401") { onLogout(); return }
      setError("Could not load notifications.")
    } finally {
      setLoading(false)
    }
  }, [token, statusFilter, categoryFilter, onLogout])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000) // poll every 5 seconds
    return () => clearInterval(interval)
  }, [load])

  async function handleMarkAll() {
    setMarkingAll(true)
    try {
      await markAllAsRead(token)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnread(0)
    } finally {
      setMarkingAll(false)
    }
  }

  function handleRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  function handleDelete(id: string) {
    const wasUnread = notifications.find(n => n.id === id)?.is_read === false
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (wasUnread) setUnread(prev => Math.max(0, prev - 1))
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🔔</span>
          </div>
          <div>
            <span className="font-semibold text-sm text-gray-900">ERP Notifications</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${backendOk ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-xs text-gray-400">
                {backendOk ? "Backend connected · localhost:8000" : "Backend unreachable"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Bell badge */}
          <div className="relative">
            <div className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center bg-white">
              <span className="text-base">🔔</span>
            </div>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </div>

          {/* User chip */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
            <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">{user[0].toUpperCase()}</span>
            </div>
            <span className="text-xs text-gray-600 font-medium">{user}</span>
          </div>

          <button onClick={onLogout}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Create form */}
        <CreateForm onCreated={load} />

        {/* Filters + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          {["", "unread", "read"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                statusFilter === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}>
              {s === "" ? "All" : s === "unread" ? `Unread (${unread})` : "Read"}
            </button>
          ))}

          <div className="h-4 w-px bg-gray-200 mx-1" />

          {/* Category filter */}
          {["", "hr", "recruitment", "system", "general"].map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                categoryFilter === c
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}>
              {c === "" ? "All categories" : c}
            </button>
          ))}

          {/* Mark all read */}
          {unread > 0 && (
            <>
              <div className="flex-1" />
              <button onClick={handleMarkAll} disabled={markingAll}
                className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:border-blue-300 transition-colors disabled:opacity-50 bg-white">
                {markingAll ? "Marking..." : `Mark all read (${unread})`}
              </button>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Notification list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <span className="text-3xl block mb-3">🔕</span>
            <p className="text-sm font-medium text-gray-900">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">
              Use "Simulate ERP event" above to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <NotifCard
                key={n.id}
                notif={n}
                token={token}
                onRead={handleRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400 pt-2">
          Auto-refreshes every 5 seconds · {notifications.length} notification{notifications.length !== 1 ? "s" : ""} shown
        </p>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT — handles login state
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState("alice")

  function handleLogin(t: string, u: string) {
    setToken(t)
    setUser(u)
  }

  function handleLogout() {
    setToken(null)
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />
  return <Dashboard token={token} user={user} onLogout={handleLogout} />
}
