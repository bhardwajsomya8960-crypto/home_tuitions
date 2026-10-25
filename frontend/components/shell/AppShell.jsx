'use client'

import { useState } from 'react'
import DesktopSidebar from './DesktopSidebar'
import MobileAppHeader from './MobileAppHeader'
import MobileBottomNav from './MobileBottomNav'
import ConnectionStatus from './ConnectionStatus'
import ProfileMenu from './ProfileMenu'

// Breakpoints: <768 mobile (app header + bottom tabs), 768-1023 tablet (icon sidebar),
// >=1024 desktop (full sidebar). `collapsed` is null while the user has not toggled.
// profileTab: the nav item the account menu's "profile" entry opens (omit when the portal has none).
export default function AppShell({ portalLabel, user, navItems, activeTab, onTabChange, onLogout, profileTab, headerActions, children }) {
  const [collapsed, setCollapsed] = useState(null)
  const active = navItems.find(item => item.id === activeTab) || navItems[0]

  const contentOffset = collapsed === null ? 'md:pl-16 lg:pl-60' : collapsed ? 'md:pl-16' : 'md:pl-60'

  const handleNavigate = (id) => {
    onTabChange(id)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const profileItem = profileTab && navItems.find(item => item.id === profileTab)
  const account = size => (
    <ProfileMenu user={user} size={size} onLogout={onLogout}
      onProfile={profileItem ? () => handleNavigate(profileItem.id) : undefined} />
  )

  return (
    <div className="min-h-screen bg-ivory text-ink">
      <ConnectionStatus />

      <DesktopSidebar
        brandLabel={portalLabel}
        navItems={navItems}
        activeTab={active.id}
        onNavigate={handleNavigate}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(prev => (prev === null ? true : !prev))}
      />

      <div className={`${contentOffset} min-h-screen flex flex-col`}>
        <MobileAppHeader portalLabel={portalLabel} title={active.label} account={account('sm')} />

        {/* Desktop top navbar */}
        <header className="hidden md:flex h-[68px] items-center justify-between gap-4 bg-ivory/90 backdrop-blur border-b border-ink/10 px-6 lg:px-8 sticky top-0 z-30">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-sage">
              <span className="truncate">{portalLabel}</span>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-ink/80 font-medium truncate">{active.label}</span>
            </nav>
            <h1 className="text-lg font-bold tracking-tight text-ink truncate">{active.label}</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {headerActions}
            {account('md')}
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
