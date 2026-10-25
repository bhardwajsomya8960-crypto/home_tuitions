'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiBarChart2, FiUsers, FiActivity, FiUserCheck, FiDollarSign, FiSettings, FiList, FiRefreshCw, FiPhoneIncoming, FiHome } from 'react-icons/fi'
import AppShell from '@/shared/shell/AppShell'
import { btn, PageLoader } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Form'
import LeadWorkspace from '@/features/admin/components/LeadWorkspace'
import TutorReview from '@/features/admin/components/TutorReview'
import { api } from '@/shared/lib/api'
import { usePortal } from '@/shared/lib/usePortal'
import { useMasters } from '@/shared/lib/useMasters'
import { NewLeadModal } from '@/features/admin/components/NewLeadModal'
import { NewParentModal } from '@/features/admin/components/NewParentModal'
import { NewTutorModal } from '@/features/admin/components/NewTutorModal'
import { NewEnquiryModal } from '@/features/admin/components/NewEnquiryModal'
import { EnquiryDetail } from '@/features/admin/components/EnquiryDetail'
import { ParentDetail } from '@/features/admin/components/ParentDetail'
import { EnquiriesTab } from '@/features/admin/components/tabs/EnquiriesTab'
import { ParentsTab } from '@/features/admin/components/tabs/ParentsTab'
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
  { id: 'enquiries', label: 'Enquiries', icon: FiPhoneIncoming },
  { id: 'leads', label: 'Leads', icon: FiUsers },
  { id: 'parents', label: 'Parents', icon: FiHome },
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
  const [enquiryId, setEnquiryId] = useState(null)
  const [parentId, setParentId] = useState(null)
  // Create forms: null when closed, otherwise { initial, enquiryId } (both empty for a blank form).
  const [newLead, setNewLead] = useState(null)
  const [newParent, setNewParent] = useState(null)
  const [newTutor, setNewTutor] = useState(null)
  const [newEnquiry, setNewEnquiry] = useState(false)

  useEffect(() => { reload() }, [version, reload])

  if (!dash || !masters) return error ? <div className="p-6"><Notice>{error}</Notice></div> : <PageLoader />
  const ops = dash.operations
  const counts = { enquiries: dash.enquiries.new, operations: ops.awaitingConfirmation + ops.noTutorQueue, tutors: dash.tutors.awaitingReview }
  const nav = NAV.map(n => (n.id in counts ? { ...n, count: counts[n.id] } : n))

  // Converting a website enquiry: open the matching form with what the caller already told us.
  const fromEnquiry = e => ({ enquiryId: e.id, initial: { phone: e.phone, ...(e.name ? { name: e.name } : {}) } })
  const enquiryNote = e => {
    const level = masters.enquiryLevels.find(l => l.value === e.level)?.label
    return [level && `Looking for: ${level}`, e.message].filter(Boolean).join('. ')
  }
  const convert = setter => e => { setEnquiryId(null); setter(e) }
  const created = open => record => { bump(); open(record) }
  const post = (path, body, message) => run(() => api(path, { method: 'POST', body, role: 'admin' }), message)

  return (
    <AppShell portalLabel="Operations" user={{ name: 'Administrator', subtitle: 'Admin' }} navItems={nav} activeTab={tab} onTabChange={setTab} onLogout={logout}
      headerActions={<button type="button" className={btn.secondary} onClick={bump} aria-label="Refresh"><FiRefreshCw aria-hidden="true" /></button>}>
      <div className="space-y-6">
        <Notice>{error}</Notice>
        <Notice tone="success">{message}</Notice>

        {tab === 'overview' && <Overview dash={dash} goto={setTab} />}
        {tab === 'enquiries' && <EnquiriesTab version={version} masters={masters} onOpen={setEnquiryId} onNew={() => setNewEnquiry(true)} />}
        {tab === 'leads' && <LeadsTab version={version} masters={masters} onOpen={setLeadId} onNew={() => setNewLead({})} />}
        {tab === 'parents' && <ParentsTab version={version} onOpen={setParentId} onNew={() => setNewParent({})} />}
        {tab === 'operations' && <OperationsTab version={version} onOpenLead={setLeadId} onConfirm={id => run(() => api(ADMIN_API.assignmentAction(id, 'confirm'), { method: 'POST', role: 'admin' }), 'Tutor confirmed.').then(bump).catch(() => {})} busy={busy} onExpire={bump} />}
        {tab === 'tutors' && <TutorsTab version={version} onOpen={setTutorId} onNew={() => setNewTutor({})} />}
        {tab === 'finance' && <FinanceTab version={version} masters={masters} run={run} busy={busy} onChanged={bump} />}
        {tab === 'settings' && <SettingsTab run={run} busy={busy} />}
        {tab === 'audit' && <AuditTab version={version} />}
      </div>

      <LeadWorkspace leadId={leadId} masters={masters} onClose={() => setLeadId(null)} onChanged={bump} />
      <TutorReview tutorId={tutorId} masters={masters} onClose={() => setTutorId(null)} onChanged={bump} />
      <EnquiryDetail enquiryId={enquiryId} masters={masters} onClose={() => setEnquiryId(null)} onChanged={bump}
        onCreateLead={convert(e => { const d = fromEnquiry(e); setNewLead({ ...d, initial: { ...d.initial, note: enquiryNote(e) } }) })}
        onCreateParent={convert(e => setNewParent(fromEnquiry(e)))}
        onCreateTutor={convert(e => { const d = fromEnquiry(e); setNewTutor({ ...d, initial: { ...d.initial, bio: e.message || '' } }) })}
        onOpenLead={id => { setEnquiryId(null); setLeadId(id) }} onOpenParent={id => { setEnquiryId(null); setParentId(id) }} onOpenTutor={id => { setEnquiryId(null); setTutorId(id) }} />
      <ParentDetail parentId={parentId} masters={masters} onClose={() => setParentId(null)} onChanged={bump} onOpenLead={id => { setParentId(null); setLeadId(id) }} />

      <NewEnquiryModal open={newEnquiry} masters={masters} busy={busy} onClose={() => setNewEnquiry(false)}
        onSubmit={body => post(ADMIN_API.enquiries, body, 'Enquiry added.').then(created(e => { setNewEnquiry(false); setTab('enquiries'); setEnquiryId(e.id) }))} />
      <NewLeadModal open={!!newLead} initial={newLead?.initial} enquiryId={newLead?.enquiryId} masters={masters} busy={busy} onClose={() => setNewLead(null)}
        onSubmit={body => post(ADMIN_API.leads, body, 'Tuition request created.').then(created(lead => { setNewLead(null); setTab('leads'); setLeadId(lead.id) }))} />
      <NewParentModal open={!!newParent} initial={newParent?.initial} enquiryId={newParent?.enquiryId} masters={masters} busy={busy} onClose={() => setNewParent(null)}
        onSubmit={body => post(ADMIN_API.parents, body, 'Parent created. Add their child and a tuition request next.').then(created(p => { setNewParent(null); setTab('parents'); setParentId(p.id) }))} />
      <NewTutorModal open={!!newTutor} initial={newTutor?.initial} enquiryId={newTutor?.enquiryId} masters={masters} busy={busy} onClose={() => setNewTutor(null)}
        onSubmit={body => post(ADMIN_API.tutors, body, 'Tutor created as pending. Upload their documents next.').then(created(t => { setNewTutor(null); setTab('tutors'); setTutorId(t.id) }))} />
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
