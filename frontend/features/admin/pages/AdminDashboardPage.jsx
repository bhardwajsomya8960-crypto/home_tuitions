'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiBarChart2, FiUsers, FiActivity, FiUserCheck, FiDollarSign, FiSettings, FiList, FiRefreshCw } from 'react-icons/fi'
import AppShell from '@/shared/shell/AppShell'
import { btn, PageLoader } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Form'
import LeadWorkspace from '@/features/admin/components/LeadWorkspace'
import TutorReview from '@/features/admin/components/TutorReview'
import { api } from '@/shared/lib/api'
import { usePortal } from '@/shared/lib/usePortal'
import { useMasters } from '@/shared/lib/useMasters'
import { NewLeadModal } from '@/features/admin/components/NewLeadModal'
import { AuditTab } from '@/features/admin/components/tabs/AuditTab'
import { FinanceTab } from '@/features/admin/components/tabs/FinanceTab'
import { LeadsTab } from '@/features/admin/components/tabs/LeadsTab'
import { OperationsTab } from '@/features/admin/components/tabs/OperationsTab'
import { Overview } from '@/features/admin/components/tabs/OverviewTab'
import { SettingsTab } from '@/features/admin/components/tabs/SettingsTab'
import { TutorsTab } from '@/features/admin/components/tabs/TutorsTab'
import { ADMIN_API } from '@/features/admin/api/endpoints'

const NAV = [
  { id: 'overview', label: 'Overview', icon: FiBarChart2 },
  { id: 'leads', label: 'Leads', icon: FiUsers },
  { id: 'operations', label: 'Operations', icon: FiActivity },
  { id: 'tutors', label: 'Tutors', icon: FiUserCheck },
  { id: 'finance', label: 'Finance', icon: FiDollarSign },
  { id: 'settings', label: 'Matching rules', icon: FiSettings },
  { id: 'audit', label: 'Audit log', icon: FiList },
]

function Console() {
  const params = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') || 'overview')
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion(v => v + 1), [])
  const { data: dash, error, message, busy, run, logout, reload } = usePortal('admin', ADMIN_API.dashboard)
  const { masters } = useMasters()
  const [leadId, setLeadId] = useState(null)
  const [tutorId, setTutorId] = useState(null)
  const [newLead, setNewLead] = useState(false)

  useEffect(() => { reload() }, [version, reload])

  if (!dash || !masters) return error ? <div className="p-6"><Notice>{error}</Notice></div> : <PageLoader />
  const ops = dash.operations
  const nav = NAV.map(n => (n.id === 'operations' ? { ...n, count: ops.awaitingConfirmation + ops.noTutorQueue } : n.id === 'tutors' ? { ...n, count: dash.tutors.awaitingReview } : n))

  return (
    <AppShell portalLabel="Operations" user={{ name: 'Administrator', subtitle: 'Admin' }} navItems={nav} activeTab={tab} onTabChange={setTab} onLogout={logout}
      headerActions={<button type="button" className={btn.secondary} onClick={bump} aria-label="Refresh"><FiRefreshCw aria-hidden="true" /></button>}>
      <div className="space-y-6">
        <Notice>{error}</Notice>
        <Notice tone="success">{message}</Notice>

        {tab === 'overview' && <Overview dash={dash} goto={setTab} />}
        {tab === 'leads' && <LeadsTab version={version} masters={masters} onOpen={setLeadId} onNew={() => setNewLead(true)} />}
        {tab === 'operations' && <OperationsTab version={version} onOpenLead={setLeadId} onConfirm={id => run(() => api(ADMIN_API.assignmentAction(id, 'confirm'), { method: 'POST', role: 'admin' }), 'Tutor confirmed.').then(bump).catch(() => {})} busy={busy} onExpire={bump} />}
        {tab === 'tutors' && <TutorsTab version={version} onOpen={setTutorId} />}
        {tab === 'finance' && <FinanceTab version={version} masters={masters} run={run} busy={busy} onChanged={bump} />}
        {tab === 'settings' && <SettingsTab run={run} busy={busy} />}
        {tab === 'audit' && <AuditTab version={version} />}
      </div>

      <LeadWorkspace leadId={leadId} masters={masters} onClose={() => setLeadId(null)} onChanged={bump} />
      <TutorReview tutorId={tutorId} masters={masters} onClose={() => setTutorId(null)} onChanged={bump} />
      <NewLeadModal open={newLead} masters={masters} busy={busy} onClose={() => setNewLead(false)}
        onSubmit={body => run(() => api(ADMIN_API.leads, { method: 'POST', body, role: 'admin' }), 'Lead created.').then(lead => { setNewLead(false); bump(); setTab('leads'); setLeadId(lead.id) })} />
    </AppShell>
  )
}

export default function AdminConsolePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Console />
    </Suspense>
  )
}
