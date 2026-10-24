'use client'

import { FiWifiOff, FiRefreshCw } from 'react-icons/fi'

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <section className="max-w-sm w-full bg-white rounded-2xl card-shadow p-8 text-center">
        <div aria-hidden="true" className="mx-auto w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <FiWifiOff className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">You're offline</h1>
        <p className="text-sm text-gray-600 mt-2">
          This page isn't available without a connection. Your account data is not stored on this device, so nothing is shown until you reconnect.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <FiRefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
      </section>
    </main>
  )
}
