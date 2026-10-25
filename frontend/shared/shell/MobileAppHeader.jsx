'use client'

import Logo from '@/shared/brand/Logo'

export default function MobileAppHeader({ portalLabel, title, account }) {
  return (
    <header
      className="md:hidden sticky top-0 z-30 bg-ivory/95 backdrop-blur border-b border-ink/10"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center gap-3 px-4 h-14">
        <Logo className="w-10 h-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-sage leading-tight">{portalLabel}</p>
          <p className="font-semibold text-ink truncate leading-tight">{title}</p>
        </div>
        {account}
      </div>
    </header>
  )
}
