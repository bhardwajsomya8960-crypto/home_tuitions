'use client'

import SimpleTable from '@/shared/ui/SimpleTable'
import Countdown from '@/shared/ui/Countdown'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, Card, PageLoader } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Form'
import { api } from '@/shared/lib/api'
import { classLabel, formatDateTime, LEAD_STATUS, MODE_LABELS } from '@/shared/lib/format'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import { ADMIN_API } from '@/features/admin/api/endpoints'

export function OperationsTab({ version, onOpenLead, onConfirm, busy, onExpire }) {
  const { data, error } = useAdminData(ADMIN_API.operations, version)
  if (error) return <Notice>{error}</Notice>
  if (!data) return <PageLoader />
  const open = id => <button type="button" className={btn.secondary} onClick={() => onOpenLead(id)}>Open lead</button>
  const leadCol = { key: 'lead', header: 'Lead', render: r => <span className="whitespace-nowrap font-medium">{r.leadCode || r.code}</span> }
  return (
    <div className="space-y-4">
      <Card title={`Awaiting confirmation (${data.awaitingConfirmation.length})`} subtitle="Tutor accepted; confirm to share contact details">
        <SimpleTable rows={data.awaitingConfirmation} empty="Nothing to confirm" columns={[
          leadCol,
          { key: 'tutor', header: 'Tutor', render: a => a.tutorName },
          { key: 'score', header: 'Score', align: 'right', render: a => a.score },
          { key: 'distance', header: 'Distance', render: a => (a.distanceKm != null ? `${a.distanceKm} km` : 'Online') },
          { key: 'accepted', header: 'Accepted', render: a => <span className="whitespace-nowrap">{formatDateTime(a.respondedAt)}</span> },
          { key: 'act', header: '', align: 'right', render: a => <span className="inline-flex gap-2"><button type="button" className={btn.success} disabled={busy} onClick={() => onConfirm(a.id)}>Confirm</button>{open(a.leadId)}</span> },
        ]} />
      </Card>
      <Card title={`No tutor found (${data.noTutor.length})`} subtitle="Expand the search, switch to online or recruit">
        <SimpleTable rows={data.noTutor} empty="Every lead has candidates" columns={[
          leadCol,
          { key: 'parent', header: 'Parent / student', render: l => <span>{l.parentName}<br /><span className="text-xs text-sage">{l.studentName}</span></span> },
          { key: 'need', header: 'Requirement', render: l => `${classLabel(l.class)} ${l.board} · ${l.subjects.join(', ')}` },
          { key: 'where', header: 'Mode / area', render: l => `${MODE_LABELS[l.mode]}${l.pincode ? ` · ${l.pincode}` : ''}` },
          { key: 'status', header: 'Status', render: l => <StatusBadge map={LEAD_STATUS} value={l.status} /> },
          { key: 'act', header: '', align: 'right', render: l => open(l.id) },
        ]} />
      </Card>
      <Card title={`Open offers (${data.openOffers.length})`}>
        <SimpleTable rows={data.openOffers} empty="No offers waiting" columns={[
          leadCol,
          { key: 'tutor', header: 'Offered to', render: a => a.tutorName },
          { key: 'score', header: 'Score', align: 'right', render: a => a.score },
          { key: 'offered', header: 'Offered', render: a => <span className="whitespace-nowrap">{formatDateTime(a.offeredAt)}</span> },
          { key: 'left', header: 'Time left', render: a => <Countdown expiresAt={a.expiresAt} onExpire={onExpire} /> },
          { key: 'act', header: '', align: 'right', render: a => open(a.leadId) },
        ]} />
      </Card>
      <Card title={`Questions from tutors (${data.infoRequests.length})`}>
        <SimpleTable rows={data.infoRequests} empty="No questions" columns={[
          leadCol,
          { key: 'tutor', header: 'Tutor', render: a => a.tutorName },
          { key: 'q', header: 'Question', render: a => a.infoRequest },
          { key: 'left', header: 'Offer time left', render: a => <Countdown expiresAt={a.expiresAt} onExpire={onExpire} /> },
          { key: 'act', header: '', align: 'right', render: a => open(a.leadId) },
        ]} />
      </Card>
      <Card title={`Escalations (${data.escalations.length})`} subtitle="Repeated missed demos">
        <SimpleTable rows={data.escalations} empty="No escalations" columns={[
          leadCol,
          { key: 'parent', header: 'Parent', render: l => <span>{l.parentName}<br /><span className="text-xs text-sage">+91 {l.parentPhone}</span></span> },
          { key: 'need', header: 'Requirement', render: l => `${classLabel(l.class)} · ${l.subjects.join(', ')}` },
          { key: 'status', header: 'Status', render: l => <StatusBadge map={LEAD_STATUS} value={l.status} /> },
          { key: 'act', header: '', align: 'right', render: l => open(l.id) },
        ]} />
      </Card>
      <Card title={`Upcoming demos (${data.upcomingDemos.length})`}>
        <SimpleTable rows={data.upcomingDemos} empty="No demos scheduled" columns={[
          { key: 'when', header: 'When', render: d => <span className="whitespace-nowrap font-medium">{formatDateTime(d.scheduledAt)}</span> },
          leadCol,
          { key: 'tutor', header: 'Tutor', render: d => d.tutorName },
          { key: 'mode', header: 'Mode', render: d => MODE_LABELS[d.mode] },
          { key: 'where', header: 'Place / link', render: d => <span className="text-xs">{d.locationNote || '—'}</span> },
          { key: 'act', header: '', align: 'right', render: d => open(d.leadId) },
        ]} />
      </Card>
    </div>
  )
}
