'use client'

import { FiMessageCircle, FiPhone, FiPlus } from 'react-icons/fi'
import DataTable from '@/shared/data/DataTable'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, PageLoader } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Form'
import { ENQUIRY_KIND, ENQUIRY_STATUS, formatDateTime } from '@/shared/lib/format'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import { ADMIN_API } from '@/features/admin/api/endpoints'

// Website callback requests, newest first. Staff call back, note what was said, and turn each
// one into a parent and tuition request, or a tutor profile.
export function EnquiriesTab({ version, masters, onOpen, onNew }) {
  const { data, error } = useAdminData(ADMIN_API.enquiriesList, version)
  if (error) return <Notice>{error}</Notice>
  if (!data) return <PageLoader />
  const levelLabel = v => masters.enquiryLevels.find(l => l.value === v)?.label
  return (
    <>
      {data.total > data.items.length && <Notice tone="info">Showing the latest {data.items.length} of {data.total} enquiries.</Notice>}
      <DataTable title="Enquiries" noun="enquiries" rows={data.items} rowKey={r => r.id}
        searchText={r => `${r.name || ''} ${r.phone} ${r.message || ''}`}
        searchPlaceholder="Search name, phone, message"
        toolbarExtra={<button type="button" className={btn.secondary} onClick={onNew}><FiPlus aria-hidden="true" /> Add enquiry</button>}
        filters={[
          { key: 'status', label: 'statuses', get: r => r.status, options: Object.entries(ENQUIRY_STATUS).map(([value, s]) => ({ value, label: s.label })) },
          { key: 'kind', label: 'types', get: r => r.kind, options: Object.entries(ENQUIRY_KIND).map(([value, label]) => ({ value, label })) },
        ]}
        columns={[
          { key: 'when', header: 'Received', sortable: true, sortValue: r => r.createdAt, render: r => <span className="text-xs">{formatDateTime(r.createdAt)}{r.repeatCount > 0 && <span className="mt-0.5 block font-semibold text-amber-700">Sent {r.repeatCount + 1} times</span>}</span> },
          { key: 'who', header: 'From', render: r => (
            <button type="button" className="text-left" onClick={() => onOpen(r.id)}>
              <span className="font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4">{r.name || 'No name given'}</span>
              <span className="block text-xs text-sage">{ENQUIRY_KIND[r.kind]}{r.role ? ` · ${r.role}` : ''}</span>
            </button>
          ) },
          { key: 'phone', header: 'Phone', render: r => (
            <span className="flex flex-col gap-1 text-sm">
              <a href={`tel:+91${r.phone}`} className="inline-flex items-center gap-1.5 font-medium text-ink underline-offset-4 hover:underline"><FiPhone aria-hidden="true" /> {r.phone}</a>
              <a href={`https://wa.me/91${r.phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-sage hover:text-ink"><FiMessageCircle aria-hidden="true" /> WhatsApp</a>
            </span>
          ) },
          { key: 'level', header: 'Level', render: r => levelLabel(r.level) || <span className="text-sage">—</span> },
          { key: 'message', header: 'Message', render: r => <span className="line-clamp-2 max-w-xs text-xs">{r.message || <span className="text-sage">—</span>}</span> },
          { key: 'status', header: 'Status', render: r => <StatusBadge map={ENQUIRY_STATUS} value={r.status} /> },
          { key: 'open', header: '', sticky: true, render: r => <button type="button" className={r.status === 'new' ? btn.primary : btn.secondary} onClick={() => onOpen(r.id)}>Open</button> },
        ]}
        emptyMessage="No enquiries yet. They arrive here when someone sends the callback form on the website." />
    </>
  )
}
