'use client'

import { useEffect, useState } from 'react'
import { PageLoader } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Form'
import SettingsForm from '@/features/admin/components/SettingsForm'
import { api } from '@/shared/lib/api'
import { ADMIN_API } from '@/features/admin/api/endpoints'

export function SettingsTab({ run, busy }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api(ADMIN_API.settings, { role: 'admin' }).then(setData).catch(e => setError(e.message)) }, [])
  if (error) return <Notice>{error}</Notice>
  if (!data) return <PageLoader />
  return <SettingsForm settings={data.settings} defaults={data.defaults} busy={busy}
    onSave={body => run(() => api(ADMIN_API.settings, { method: 'PUT', body, role: 'admin' }), 'Matching rules saved. They apply to the next matching run.').then(setData).catch(() => {})} />
}
