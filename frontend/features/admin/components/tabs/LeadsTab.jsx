'use client'

import { FiPlus } from 'react-icons/fi'
import DataTable from '@/shared/data/DataTable'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, PageLoader } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Form'
import { api } from '@/shared/lib/api'
import { classLabel, formatDateTime, LEAD_STATUS, MODE_LABELS } from '@/shared/lib/format'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import { ADMIN_API } from '@/features/admin/api/endpoints'

export function LeadsTab({ version, masters, onOpen, onNew }) {
  const { data, error } = useAdminData(ADMIN_API.leadsList, version)
  if (error) return <Notice>{error}</Notice>
  if (!data) return <PageLoader />
  return (
    <>
      {data.total > data.items.length && <Notice tone="info">Showing the latest {data.items.length} of {data.total} leads.</Notice>}
      <DataTable title="Leads" noun="leads" rows={data.items} rowKey={r => r.id}
        searchText={r => `${r.code} ${r.parentName} ${r.parentPhone} ${r.studentName} ${r.pincode || ''} ${r.subjects.join(' ')}`}
        searchPlaceholder="Search code, name, phone, pincode"
        toolbarExtra={<button type="button" className={btn.primary} onClick={onNew}><FiPlus aria-hidden="true" /> New lead</button>}
        filters={[
          { key: 'status', label: 'statuses', get: r => r.status, options: masters.leadStatuses.map(s => ({ value: s, label: LEAD_STATUS[s].label })) },
          { key: 'source', label: 'sources', get: r => r.source, options: masters.leadSources.map(s => ({ value: s, label: s })) },
          { key: 'mode', label: 'modes', get: r => r.mode, options: masters.leadModes.map(m => ({ value: m, label: MODE_LABELS[m] })) },
        ]}
        columns={[
          { key: 'code', header: 'Lead', sortable: true, sortValue: r => r.code, render: r => <button type="button" className="font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4 hover:decoration-ink" onClick={() => onOpen(r.id)}>{r.code}</button> },
          { key: 'parent', header: 'Parent / student', render: r => <span><span className="font-medium">{r.parentName}</span><br /><span className="text-xs text-sage">{r.studentName} · {classLabel(r.class)} {r.board}</span></span> },
          { key: 'subjects', header: 'Subjects', render: r => r.subjects.join(', ') },
          { key: 'where', header: 'Mode / area', render: r => `${MODE_LABELS[r.mode]}${r.pincode ? ` · ${r.pincode}` : ''}` },
          { key: 'status', header: 'Status', render: r => <span className="flex flex-col items-start gap-1"><StatusBadge map={LEAD_STATUS} value={r.status} />{r.noTutorFound && <span className="text-xs font-semibold text-red-700">No tutor</span>}</span> },
          { key: 'created', header: 'Created', sortable: true, sortValue: r => r.createdAt, render: r => <span className="text-xs">{formatDateTime(r.createdAt)}</span> },
          { key: 'open', header: '', sticky: true, render: r => <button type="button" className={btn.secondary} onClick={() => onOpen(r.id)}>Open</button> },
        ]}
        emptyMessage="No leads yet. Leads arrive from the parent enquiry form, or add one with New lead." />
    </>
  )
}
