'use client'

import { FiChevronsLeft, FiChevronsRight, FiLogOut } from 'react-icons/fi'
import Logo from '../landing/Logo'

// collapsed: null = responsive (icons on tablet, full on desktop), true = icons only, false = full
export default function DesktopSidebar({ brandLabel, user, navItems, activeTab, onNavigate, collapsed, onToggleCollapsed, onLogout }) {
  const widthClass = collapsed === null ? 'md:w-16 lg:w-60' : collapsed ? 'md:w-16' : 'md:w-60'
  const labelClass = collapsed === null ? 'hidden lg:inline' : collapsed ? 'hidden' : 'inline'
  const brandClass = collapsed === null ? 'hidden lg:block' : collapsed ? 'hidden' : 'block'
  const centerClass = collapsed === null ? 'md:justify-center lg:justify-start' : collapsed ? 'justify-center' : 'justify-start'

  return (
    <aside
      aria-label="Sidebar"
      className={`hidden md:flex fixed inset-y-0 left-0 z-40 flex-col bg-ink text-ivory ${widthClass}`}
    >
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-ivory/10 ${centerClass}`}>
        <span className="flex w-9 h-9 shrink-0 items-center justify-center rounded-full bg-ivory"><Logo className="w-7 h-7" /></span>
        <div className={brandClass}>
          <p className="font-bold text-ivory leading-tight">Home Tuition</p>
          <p className="text-xs text-ivory/60">{brandLabel}</p>
        </div>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = item.id === activeTab
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lemon ${centerClass} ${
                isActive ? 'bg-lemon text-ink font-semibold' : 'text-ivory/70 hover:bg-ivory/10 hover:text-ivory'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span className={labelClass}>{item.label}</span>
              {item.count > 0 && <span className={`ml-auto rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white ${labelClass}`}>{item.count}</span>}
            </button>
          )
        })}
      </nav>

      <div className="p-2 border-t border-ivory/10 space-y-1">
        <div className={`flex items-center gap-3 px-3 py-2 ${centerClass}`}>
          <div aria-hidden="true" className="w-8 h-8 rounded-full bg-lavender text-ink font-semibold flex items-center justify-center text-xs shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className={`min-w-0 ${brandClass}`}>
            <p className="text-sm font-semibold text-ivory truncate">{user.name}</p>
            <p className="text-xs text-ivory/60 truncate">{user.subtitle}</p>
          </div>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Sign out"
            className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-coral hover:bg-ivory/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral ${centerClass}`}
          >
            <FiLogOut className="w-5 h-5" aria-hidden="true" />
            <span className={labelClass}>Sign out</span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-ivory/70 hover:bg-ivory/10 hover:text-ivory focus:outline-none focus-visible:ring-2 focus-visible:ring-lemon ${centerClass}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronsRight className="w-5 h-5" aria-hidden="true" /> : <FiChevronsLeft className="w-5 h-5" aria-hidden="true" />}
          <span className={labelClass}>Collapse</span>
        </button>
      </div>
    </aside>
  )
}
