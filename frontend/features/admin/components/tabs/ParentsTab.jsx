'use client'

import { FiPlus } from 'react-icons/fi'
import DataTable from '@/shared/data/DataTable'
import Badge from '@/shared/ui/Badge'
import { btn, PageLoader } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Form'
import { formatDate } from '@/shared/lib/format'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import { ADMIN_API } from '@/features/admin/api/endpoints'

// Every parent account, whether they registered on the website or staff added them.
export function ParentsTab({ version, onOpen, onNew }) {
  const { data, error } = useAdminData(ADMIN_API.parentsList, version)
  if (error) return <Notice>{error}</Notice>
  if (!data) return <PageLoader />
  return (
    <>
      {data.total > data.items.length && <Notice tone="info">Showing the latest {data.items.length} of {data.total} parents.</Notice>}
      <DataTable title="Parents" noun="parents" rows={data.items} rowKey={r => r.id}
        searchText={r => `${r.name} ${r.phone} ${r.email || ''} ${r.pincode || ''}`}
        searchPlaceholder="Search name, phone, email, pincode"
        toolbarExtra={<button type="button" className={btn.primary} onClick={onNew}><FiPlus aria-hidden="true" /> New parent</button>}
        filters={[{ key: 'origin', label: 'origins', get: r => (r.createdByStaff ? 'staff' : 'website'), options: [{ value: 'website', label: 'Registered on the website' }, { value: 'staff', label: 'Added by staff' }] }]}
        columns={[
          { key: 'name', header: 'Parent', sortable: true, sortValue: r => r.name, render: r => (
            <button type="button" className="text-left" onClick={() => onOpen(r.id)}>
              <span className="font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4">{r.name}</span>
              <span className="block text-xs text-sage">{r.relationship}{r.createdByStaff ? ' · added by staff' : ''}</span>
            </button>
          ) },
          { key: 'phone', header: 'Phone', render: r => <a href={`tel:+91${r.phone}`} className="underline-offset-4 hover:underline">+91 {r.phone}</a> },
          { key: 'students', header: 'Students', align: 'right', sortable: true, sortValue: r => r.students, render: r => r.students },
          { key: 'requests', header: 'Requests', render: r => <span className="flex items-center gap-2">{r.requests}{r.openRequests > 0 && <Badge tone="yellow">{r.openRequests} open</Badge>}</span> },
          { key: 'pincode', header: 'Pincode', render: r => r.pincode || <span className="text-sage">—</span> },
          { key: 'created', header: 'Since', sortable: true, sortValue: r => r.createdAt, render: r => <span className="text-xs">{formatDate(r.createdAt)}</span> },
          { key: 'open', header: '', sticky: true, render: r => <button type="button" className={btn.secondary} onClick={() => onOpen(r.id)}>Open</button> },
        ]}
        emptyMessage="No parents yet. Add one with New parent, or from an enquiry." />
    </>
  )
}
