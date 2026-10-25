'use client'

import SimpleTable from '@/shared/ui/SimpleTable'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, Card, SummaryTable } from '@/shared/ui/Card'
import { LEAD_STATUS, rupees } from '@/shared/lib/format'

export function Overview({ dash, goto }) {
  const pipeline = ['new', 'contacted', 'qualified', 'matching', 'tutor_offered', 'tutor_accepted', 'demo_scheduled', 'demo_completed', 'converted', 'on_hold', 'lost', 'cancelled']
  const max = Math.max(1, ...pipeline.map(s => dash.leads.byStatus[s]))
  return (
    <>
      <SummaryTable items={[
        { label: 'New enquiries', value: dash.enquiries.new, hint: `${dash.enquiries.contacted} called, not yet converted`, tone: dash.enquiries.new ? 'orange' : undefined },
        { label: 'Leads', value: dash.leads.total, hint: `${dash.leads.byStatus.new} new` },
        { label: 'Conversion rate', value: `${dash.conversionRate}%`, hint: `${dash.leads.byStatus.converted} converted` },
        { label: 'Active tutors', value: dash.tutors.byStatus.active || 0, hint: `${dash.tutors.awaitingReview} awaiting review` },
        { label: 'Active enrolments', value: dash.enrolments.active },
        { label: 'Collected', value: rupees(dash.finance.collected) },
        { label: 'Outstanding', value: rupees(dash.finance.outstanding), hint: dash.finance.overdue ? `${rupees(dash.finance.overdue)} overdue` : 'Nothing overdue', tone: dash.finance.overdue ? 'red' : undefined },
        { label: 'Open offers', value: dash.operations.openOffers, hint: `${dash.operations.awaitingConfirmation} awaiting confirmation`, tone: dash.operations.awaitingConfirmation ? 'orange' : undefined },
        { label: 'No tutor found', value: dash.operations.noTutorQueue, hint: `${dash.operations.upcomingDemos} demos in the next 7 days`, tone: dash.operations.noTutorQueue ? 'red' : undefined },
      ]} />
      <Card title="Lead pipeline" actions={<button type="button" className={btn.link} onClick={() => goto('leads')}>View leads</button>}>
        <SimpleTable rows={pipeline.map(st => ({ id: st, count: dash.leads.byStatus[st] }))} minWidth={480} columns={[
          { key: 'stage', header: 'Stage', render: r => <StatusBadge map={LEAD_STATUS} value={r.id} /> },
          { key: 'count', header: 'Leads', align: 'right', render: r => <span className="font-semibold tabular-nums">{r.count}</span> },
          { key: 'share', header: 'Share of all leads', render: r => (
            <span className="flex items-center gap-3">
              <span className="h-2 w-40 overflow-hidden rounded-full bg-sand-100"><span className="block h-full rounded-full bg-ink" style={{ width: `${(r.count / max) * 100}%` }} /></span>
              <span className="text-xs tabular-nums text-sage">{dash.leads.total ? Math.round((r.count / dash.leads.total) * 100) : 0}%</span>
            </span>
          ) },
        ]} />
      </Card>
    </>
  )
}
