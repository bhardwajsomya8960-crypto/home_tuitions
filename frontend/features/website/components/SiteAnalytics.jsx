'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { captureUtm } from '@/shared/lib/utm'

// Site-wide tracking, all switched by environment variables (Vercel → Settings → Environment
// Variables, then redeploy). Nothing is loaded when they are unset.
//   NEXT_PUBLIC_META_PIXEL_ID  Meta Pixel ID (digits). Events: PageView, plus Lead and Contact
//                              from shared/lib/tracking.js.
//   NEXT_PUBLIC_GA4_ID         Google Analytics 4 measurement ID (G-XXXXXXX).
// It also keeps the visit's UTM parameters (shared/lib/utm.js) for the lead forms.
const env = (value, pattern) => (pattern.test(value || '') ? value : '')
const PIXEL_ID = env(process.env.NEXT_PUBLIC_META_PIXEL_ID, /^\d{5,20}$/)
const GA4_ID = env(process.env.NEXT_PUBLIC_GA4_ID, /^G-[A-Z0-9]{4,20}$/)

export default function SiteAnalytics() {
  const pathname = usePathname()
  const firstView = useRef(true)

  useEffect(() => { captureUtm() }, [pathname])

  // The Pixel's own snippet counts the first page; count later in-app navigations here.
  useEffect(() => {
    if (firstView.current) { firstView.current = false; return }
    try { window.fbq?.('track', 'PageView') } catch { /* ignore */ }
  }, [pathname])

  if (!PIXEL_ID && !GA4_ID) return null

  return (
    <>
      {PIXEL_ID && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element -- Meta's no-JavaScript fallback must be a plain image */}
            <img height="1" width="1" alt="" style={{ display: 'none' }} src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} />
          </noscript>
        </>
      )}
      {GA4_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA4_ID}');`}
          </Script>
        </>
      )}
    </>
  )
}
