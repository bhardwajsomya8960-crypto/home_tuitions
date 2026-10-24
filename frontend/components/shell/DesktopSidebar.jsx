'use client'

import { FiChevronsLeft, FiChevronsRight, FiLogOut } from 'react-icons/fi'

// collapsed: null = responsive (icons on tablet, full on desktop), true = icons only, false = full
export default function DesktopSidebar({ brandLabel, user, navItems, activeTab, onNavigate, collapsed, onToggleCollapsed, onLogout }) {
  const widthClass = collapsed === null ? 'md:w-16 lg:w-60' : collapsed ? 'md:w-16' : 'md:w-60'
  const labelClass = collapsed === null ? 'hidden lg:inline' : collapsed ? 'hidden' : 'inline'
  const brandClass = collapsed === null ? 'hidden lg:block' : collapsed ? 'hidden' : 'block'
  const centerClass = collapsed === null ? 'md:justify-center lg:justify-start' : collapsed ? 'justify-center' : 'justify-start'

  return (
    <aside
      aria-label="Sidebar"
      className={`hidden md:flex fixed inset-y-0 left-0 z-40 flex-col bg-white border-r ${widthClass}`}
    >
      <div className={`flex items-center gap-3 px-4 h-16 border-b ${centerClass}`}>
        <div aria-hidden="true" className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
          ht
        </div>
        <div className={brandClass}>
          <p className="font-bold text-gray-900 leading-tight">home tution</p>
          <p className="text-xs text-gray-500">{brandLabel}</p>
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${centerClass} ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span className={labelClass}>{item.label}</span>
              {item.count > 0 && <span className={`ml-auto rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white ${labelClass}`}>{item.count}</span>}
            </button>
          )
        })}
      </nav>

      <div className="p-2 border-t space-y-1">
        <div className={`flex items-center gap-3 px-3 py-2 ${centerClass}`}>
          <div aria-hidden="true" className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-xs shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className={`min-w-0 ${brandClass}`}>
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.subtitle}</p>
          </div>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Sign out"
            className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${centerClass}`}
          >
            <FiLogOut className="w-5 h-5" aria-hidden="true" />
            <span className={labelClass}>Sign out</span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${centerClass}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronsRight className="w-5 h-5" aria-hidden="true" /> : <FiChevronsLeft className="w-5 h-5" aria-hidden="true" />}
          <span className={labelClass}>Collapse</span>
        </button>
      </div>
    </aside>
  )
}
