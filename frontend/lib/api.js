'use client'

// Browser client for the API. Sessions are kept per role in localStorage so a parent, tutor and
// admin can be signed in side by side on the same device during development. Tokens are only
// ever sent to the API origin; API responses are never cached (see next.config.js).

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const KEY = role => `ht.session.${role}`

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || 'Something went wrong. Please try again.')
    this.status = status
    this.code = body?.code
    this.details = body?.details || []
  }

  // Field errors keyed by field name, for showing under inputs.
  fieldErrors() {
    return Object.fromEntries(this.details.filter(d => d.field).map(d => [d.field, d.message]))
  }
}

export function getSession(role) {
  try {
    const raw = window.localStorage.getItem(KEY(role))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(role, session) {
  try {
    window.localStorage.setItem(KEY(role), JSON.stringify(session))
  } catch {
    // Storage unavailable (private mode): the session lasts for this page only.
  }
}

export function clearSession(role) {
  try {
    window.localStorage.removeItem(KEY(role))
  } catch {
    // ignore
  }
}

// `role` attaches that role's token. A 401 clears the stored session so the page can send the
// user back to sign in.
export async function api(path, { method = 'GET', body, role, form } = {}) {
  const session = role ? getSession(role) : null
  const headers = {}
  if (session?.token) headers.Authorization = `Bearer ${session.token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: form || (body !== undefined ? JSON.stringify(body) : undefined),
      cache: 'no-store',
    })
  } catch {
    throw new ApiError(0, { error: 'Could not reach the server. Check your connection and try again.', code: 'NETWORK' })
  }
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { json = null }
  if (!res.ok) {
    if (res.status === 401 && role) clearSession(role)
    throw new ApiError(res.status, json)
  }
  return json
}

// Opens a protected file (KYC document) in a new tab using the session token.
export async function openProtectedFile(path, role) {
  const session = getSession(role)
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${session?.token}` }, cache: 'no-store' })
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null))
  const url = URL.createObjectURL(await res.blob())
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
