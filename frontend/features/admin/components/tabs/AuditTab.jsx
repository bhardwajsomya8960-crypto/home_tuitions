'use client'

import { useState } from 'react'
import { btn, Card, PageLoader } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Form'
import { api } from '@/shared/lib/api'
import { formatDateTime } from '@/shared/lib/format'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import { ADMIN_API } from '@/features/admin/api/endpoints'

export function AuditTab({ version }) {
  const [page, setPage] = useState(1)
  const { data, error } = useAdminData(ADMIN_API.audit(page), version)
  if (error) return <Notice>{error}</Notice>
  if (!data) return <PageLoader />
  const pages = Math.max(1, Math.ceil(data.total / data.limit))
  return (
    <Card title="Audit log" subtitle={`${data.total} recorded actions. Entries cannot be edited or deleted.`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-sand-50 text-xs uppercase text-sage"><tr><th className="px-3 py-2">When</th><th className="px-3 py-2">Who</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Record</th><th className="px-3 py-2">Details</th></tr></thead>
          <tbody className="divide-y divide-sand-100">
            {data.items.map(a => (
              <tr key={a.id} className="align-top">
                <td className="whitespace-nowrap px-3 py-2 text-xs">{formatDateTime(a.createdAt)}</td>
                <td className="px-3 py-2 text-xs">{a.actor.split(':')[0]}</td>
                <td className="px-3 py-2 font-medium">{a.action}</td>
                <td className="px-3 py-2 text-xs">{a.entity}</td>
                <td className="px-3 py-2"><code className="block max-w-md truncate text-xs text-sage" title={a.details ? JSON.stringify(a.details) : ''}>{a.details ? JSON.stringify(a.details) : '—'}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <button type="button" className={btn.secondary} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button type="button" className={btn.secondary} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </Card>
  )
}
