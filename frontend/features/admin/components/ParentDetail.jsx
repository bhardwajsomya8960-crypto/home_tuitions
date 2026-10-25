'use client'

import { useCallback, useEffect, useState } from 'react'
import { FiMessageCircle, FiPhone, FiPlus } from 'react-icons/fi'
import Modal from '@/shared/ui/Modal'
import SimpleTable from '@/shared/ui/SimpleTable'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, Details, PageLoader } from '@/shared/ui/Card'
import { Notice, Select, TextInput } from '@/shared/ui/Form'
import { api, formErrors } from '@/shared/lib/api'
import { classLabel, formatDate, formatDateTime, LEAD_STATUS, MODE_LABELS } from '@/shared/lib/format'
import { ADMIN_API } from '@/features/admin/api/endpoints'
import { blankRequirement, RequirementFields, requirementBody } from '@/features/admin/components/RequirementFields'

// One parent: details, students and tuition requests. Staff add students and requests here.
export function ParentDetail({ parentId, masters, onClose, onChanged, onOpenLead }) {
  const [p, setP] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [addingStudent, setAddingStudent] = useState(false)
  const [requestFor, setRequestFor] = useState(null)

  const load = useCallback(() => api(ADMIN_API.parent(parentId), { role: 'admin' }).then(setP).catch(err => setError(err.message)), [parentId])
  useEffect(() => { if (parentId) { setP(null); setError(''); setNotice(''); load() } }, [parentId, load])

  const post = async (path, body, success) => {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await api(path, { method: 'POST', body, role: 'admin' })
      setNotice(success)
      onChanged?.()
      return result
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={!!parentId} title={p ? p.name : 'Parent'} onClose={onClose} wide>
      {!p ? (error ? <Notice>{error}</Notice> : <PageLoader />) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <a href={`tel:+91${p.phone}`} className={btn.secondary}><FiPhone aria-hidden="true" /> +91 {p.phone}</a>
            <a href={`https://wa.me/91${p.phone}`} target="_blank" rel="noopener noreferrer" className={btn.secondary}><FiMessageCircle aria-hidden="true" /> WhatsApp</a>
          </div>
          <Notice>{error}</Notice>
          <Notice tone="success">{notice}</Notice>
          <Details items={[
            ['Relationship', p.relationship], ['Email', p.email], ['Address', [p.address, p.pincode].filter(Boolean).join(', ')],
            ['Account', p.consent?.recordedBy ? `Added by staff on ${formatDate(p.createdAt)}` : `Registered on the website on ${formatDate(p.createdAt)}`],
          ]} />

          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold">Students</h3>
              <button type="button" className={btn.secondary} onClick={() => setAddingStudent(true)}><FiPlus aria-hidden="true" /> Add student</button>
            </div>
            <SimpleTable flush={false} minWidth={560} rows={p.students} empty="No students yet. Add one to create a tuition request." columns={[
              { key: 'name', header: 'Student', render: s => <span className="font-medium">{s.name}</span> },
              { key: 'class', header: 'Class', render: s => `${classLabel(s.class)} · ${s.board}` },
              { key: 'school', header: 'School', render: s => s.school || <span className="text-sage">—</span> },
              { key: 'act', header: '', align: 'right', sticky: true, render: s => <button type="button" className={btn.primary} onClick={() => setRequestFor(s)}>New request</button> },
            ]} />
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold">Tuition requests</h3>
            <SimpleTable flush={false} minWidth={600} rows={p.requests} empty="No tuition requests yet." columns={[
              { key: 'code', header: 'Request', render: r => <button type="button" className="font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4" onClick={() => onOpenLead(r.id)}>{r.code}</button> },
              { key: 'student', header: 'Student', render: r => `${r.studentName} · ${classLabel(r.class)}` },
              { key: 'subjects', header: 'Subjects', render: r => `${r.subjects.join(', ')} · ${MODE_LABELS[r.mode]}` },
              { key: 'status', header: 'Status', render: r => <StatusBadge map={LEAD_STATUS} value={r.status} /> },
              { key: 'created', header: 'Created', className: 'whitespace-nowrap text-xs', render: r => formatDateTime(r.createdAt) },
            ]} />
          </section>
        </div>
      )}

      <AddStudentModal open={addingStudent} masters={masters} busy={busy} onClose={() => setAddingStudent(false)}
        onSubmit={body => post(ADMIN_API.parentStudents(parentId), body, 'Student added.').then(updated => { setP(updated); setAddingStudent(false) })} />
      <RequestModal student={requestFor} masters={masters} busy={busy} parent={p} onClose={() => setRequestFor(null)}
        onSubmit={body => post(ADMIN_API.parentLeads(parentId), body, 'Tuition request created.').then(lead => { setRequestFor(null); load(); onOpenLead(lead.id) })} />
    </Modal>
  )
}

function AddStudentModal({ open, masters, busy, onClose, onSubmit }) {
  const blank = { studentName: '', studentClass: '', board: '', school: '' }
  const [f, setF] = useState(blank)
  const [errors, setErrors] = useState({})
  useEffect(() => { if (open) { setF(blank); setErrors({}) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  const submit = () => onSubmit({ studentName: f.studentName.trim(), studentClass: f.studentClass, board: f.board, ...(f.school.trim() ? { school: f.school.trim() } : {}) })
    .catch(err => setErrors(formErrors(err)))
  return (
    <Modal open={open} title="Add student" onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy} onClick={submit}>Add student</button></>}>
      <Notice>{errors._form}</Notice>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Student name" required value={f.studentName} onChange={e => set('studentName', e.target.value)} error={errors.studentName} />
        <Select label="Class" required options={masters.classes.map(c => ({ value: c, label: classLabel(c) }))} value={f.studentClass} onChange={e => set('studentClass', e.target.value)} error={errors.studentClass} />
        <Select label="Board" required options={masters.boards} value={f.board} onChange={e => set('board', e.target.value)} error={errors.board} />
        <TextInput label="School" hint="Optional" value={f.school} onChange={e => set('school', e.target.value)} />
      </div>
    </Modal>
  )
}

// A tuition request for one of this parent's students. The parent's saved address is used for
// home tuition unless another is entered.
function RequestModal({ student, parent, masters, busy, onClose, onSubmit }) {
  const [f, setF] = useState(blankRequirement)
  const [errors, setErrors] = useState({})
  useEffect(() => { if (student) { setF({ ...blankRequirement, pincode: parent?.pincode || '' }); setErrors({}) } }, [student]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  const submit = () => onSubmit({ studentId: student.id, ...requirementBody(f) }).catch(err => setErrors(formErrors(err)))
  return (
    <Modal open={!!student} title={student ? `New tuition request for ${student.name}` : 'New tuition request'} onClose={onClose} wide
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy} onClick={submit}>Create request</button></>}>
      <div className="space-y-4">
        <Notice>{errors._form}</Notice>
        {student && <p className="text-sm text-sage">{classLabel(student.class)} · {student.board}</p>}
        <RequirementFields f={f} set={set} errors={errors} masters={masters} addressHint={parent?.address ? `Leave empty to use ${parent.address}` : undefined} />
      </div>
    </Modal>
  )
}
