// Conversion events for Meta Pixel and GA4 (loaded by SiteAnalytics when their IDs are set).
// Safe to call when neither is installed: nothing happens.
//   trackLead     a callback request was sent successfully
//   trackContact  a WhatsApp or Call button was tapped
function send(metaEvent, gaEvent, params) {
  if (typeof window === 'undefined') return
  const clean = Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  try { window.fbq?.('track', metaEvent, clean) } catch { /* tracking must never break the page */ }
  try { window.gtag?.('event', gaEvent, clean) } catch { /* same */ }
}

export const trackLead = params => send('Lead', 'generate_lead', params)
export const trackContact = params => send('Contact', 'contact', params)
