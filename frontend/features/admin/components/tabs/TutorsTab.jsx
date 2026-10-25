'use client'

import DataTable from '@/shared/data/DataTable'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, PageLoader } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Form'
import { api } from '@/shared/lib/api'
import { classLabel, MODE_LABELS, TUTOR_STATUS } from '@/shared/lib/format'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import { ADMIN_API } from '@/features/admin/api/endpoints'

export function TutorsTab({ version, onOpen }) {
  const { data, error } = useAdminData(ADMIN_API.tutorsList, version)
  if (error) return <Notice>{error}</Notice>
  if (!data) return <PageLoader />
  return (
    <DataTable title="Tutors" noun="tutors" rows={data.items} rowKey={r => r.id}
      searchText={r => `${r.name} ${r.phone} ${r.email} ${r.pincode} ${r.subjects.join(' ')}`}
      filters={[{ key: 'status', label: 'statuses', get: r => r.status, options: Object.entries(TUTOR_STATUS).map(([value, v]) => ({ value, label: v.label })) }]}
      columns={[
        { key: 'name', header: 'Tutor', sortable: true, sortValue: r => r.name, render: r => <button type="button" className="text-left font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4 hover:decoration-ink" onClick={() => onOpen(r.id)}>{r.name}<br /><span className="text-xs font-normal text-sage">+91 {r.phone}</span></button> },
        { key: 'teaches', header: 'Teaches', render: r => <span className="text-xs">{r.subjects.join(', ')}<br />{r.classes.map(classLabel).join(', ')}</span> },
        { key: 'mode', header: 'Mode / area', render: r => `${r.modes.map(m => MODE_LABELS[m]).join(', ')} · ${r.pincode}` },
        { key: 'exp', header: 'Experience', sortable: true, sortValue: r => r.experienceYears, render: r => `${r.experienceYears} yrs` },
        { key: 'rating', header: 'Rating', sortable: true, sortValue: r => r.ratingAvg || 0, render: r => (r.ratingCount ? `${r.ratingAvg.toFixed(1)} (${r.ratingCount})` : '—') },
        { key: 'students', header: 'Students', render: r => r.activeStudents },
        { key: 'status', header: 'Status', render: r => <span className="flex flex-col gap-1"><StatusBadge map={TUTOR_STATUS} value={r.status} />{!r.acceptingLeads && <span className="text-xs text-amber-700">Paused leads</span>}</span> },
        { key: 'open', header: '', sticky: true, render: r => <button type="button" className={btn.secondary} onClick={() => onOpen(r.id)}>Review</button> },
      ]}
      emptyMessage="No tutors have registered yet." />
  )
}
