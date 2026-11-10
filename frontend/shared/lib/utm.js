// Campaign (UTM) parameters from the landing URL, kept for the visit in sessionStorage so a
// lead sent from a later page still carries the campaign that brought the visitor in.
// A new set of UTMs in the URL replaces the stored one.
export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
const STORE = 'ht.utm'

function fromUrl() {
  const params = new URLSearchParams(window.location.search)
  const found = {}
  for (const key of UTM_KEYS) {
    const value = params.get(key)
    if (value) found[key] = value.slice(0, 100)
  }
  return found
}

export function captureUtm() {
  if (typeof window === 'undefined') return
  const found = fromUrl()
  if (!Object.keys(found).length) return
  try {
    window.sessionStorage.setItem(STORE, JSON.stringify(found))
  } catch {
    // storage blocked (private mode): the URL values are still read at submit time
  }
}

export function getUtm() {
  if (typeof window === 'undefined') return {}
  let stored = {}
  try {
    stored = JSON.parse(window.sessionStorage.getItem(STORE) || '{}') || {}
  } catch {
    stored = {}
  }
  const current = fromUrl()
  return Object.keys(current).length ? current : stored
}
