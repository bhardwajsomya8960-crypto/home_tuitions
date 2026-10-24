'use client'

import { useState } from 'react'
import DesktopSidebar from './DesktopSidebar'
import MobileAppHeader from './MobileAppHeader'
import MobileBottomNav from './MobileBottomNav'
import ConnectionStatus from './ConnectionStatus'

// Breakpoints: <768 mobile (app header + bottom tabs), 768-1023 tablet (icon sidebar),
// >=1024 desktop (full sidebar). `collapsed` is null while the user has not toggled.
export default function AppShell({ portalLabel, user, navItems, activeTab, onTabChange, children }) {
  const [collapsed, setCollapsed] = useState(null)
  const active = navItems.find(item => item.id === activeTab) || navItems[0]

  const contentOffset = collapsed === null ? 'md:pl-16 lg:pl-60' : collapsed ? 'md:pl-16' : 'md:pl-60'

  const handleNavigate = (id) => {
    onTabChange(id)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConnectionStatus />

      <DesktopSidebar
        brandLabel={portalLabel}
        user={user}
        navItems={navItems}
        activeTab={active.id}
        onNavigate={handleNavigate}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(prev => (prev === null ? true : !prev))}
      />

      <div className={`${contentOffset} min-h-screen flex flex-col`}>
        <MobileAppHeader portalLabel={portalLabel} title={active.label} />

        {/* Desktop top navbar */}
        <header className="hidden md:flex h-[68px] items-center justify-between gap-4 bg-white border-b border-gray-200 px-6 lg:px-8 sticky top-0 z-30">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="truncate">{portalLabel}</span>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-gray-700 font-medium truncate">{active.label}</span>
            </nav>
            <h1 className="text-lg font-semibold text-gray-900 truncate">{active.label}</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{user.name}</p>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{user.subtitle}</p>
            </div>
            <div
              aria-hidden="true"
              className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-sm"
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-28 md:pb-10">
          {children}
        </main>
      </div>

      <MobileBottomNav navItems={navItems} activeTab={active.id} onNavigate={handleNavigate} />
    </div>
  )
}
