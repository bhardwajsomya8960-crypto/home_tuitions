import { NextResponse } from 'next/server'

// Each port serves a different portal. The port comes from the Host header,
// which carries the port the browser used (works locally and in Docker, where
// every container listens on 3000 internally).
const PORTAL_BY_PORT = {
  '3001': '/tutor/dashboard',
  '3002': '/parent/dashboard',
  '3003': '/admin/dashboard',
}

export function middleware(request) {
  const { pathname } = request.nextUrl
  if (pathname !== '/') return NextResponse.next()

  const port = (request.headers.get('host') || '').split(':')[1]
  const target = PORTAL_BY_PORT[port]
  if (!target) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = target
  return NextResponse.redirect(url)
}

export const config = {
  matcher: '/',
}
