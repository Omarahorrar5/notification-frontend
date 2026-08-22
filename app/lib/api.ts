// All communication with the backend lives here.
// Components never call fetch() directly.

const API = "http://localhost:8000"

export type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  category: string
  priority: "low" | "normal" | "high"
  is_read: boolean
  source_event: string | null
  created_at: string
}

// ── Auth header helper ────────────────────────────────────────────────────────
function authHeader(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

// ── Fetch all my notifications (with optional filters) ────────────────────────
export async function fetchNotifications(
  token: string,
  status?: string,
  category?: string
): Promise<Notification[]> {
  const params = new URLSearchParams()
  if (status) params.append("status", status)
  if (category) params.append("category", category)
  const query = params.toString() ? `?${params.toString()}` : ""
  const res = await fetch(`${API}/notifications/me${query}`, {
    headers: authHeader(token),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

// ── Fetch unread count (bell badge) ──────────────────────────────────────────
export async function fetchUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${API}/notifications/me/unread-count`, {
    headers: authHeader(token),
    cache: "no-store",
  })
  if (!res.ok) return 0
  const data = await res.json()
  return data.unread
}

// ── Mark one notification as read ────────────────────────────────────────────
export async function markAsRead(token: string, id: string): Promise<void> {
  await fetch(`${API}/notifications/${id}/read`, {
    method: "PATCH",
    headers: authHeader(token),
  })
}

// ── Mark all notifications as read ───────────────────────────────────────────
export async function markAllAsRead(token: string): Promise<number> {
  const res = await fetch(`${API}/notifications/me/read-all`, {
    method: "PATCH",
    headers: authHeader(token),
  })
  const data = await res.json()
  return data.marked_read
}

// ── Delete a notification ─────────────────────────────────────────────────────
export async function deleteNotification(token: string, id: string): Promise<void> {
  const res = await fetch(`${API}/notifications/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  })
  if (res.status === 403) throw new Error("403")
  if (res.status === 404) throw new Error("404")
}

// ── Create a notification (simulate ERP service call) ────────────────────────
export async function createNotification(data: {
  user_id: string
  title: string
  message: string
  category: string
  priority: string
}): Promise<Notification> {
  const res = await fetch(`${API}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail ?? "Failed to create notification")
  }
  return res.json()
}

// ── Health check ──────────────────────────────────────────────────────────────
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/health`, { cache: "no-store" })
    return res.ok
  } catch {
    return false
  }
}
