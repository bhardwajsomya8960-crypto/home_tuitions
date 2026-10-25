'use client'

import { Notice } from '@/shared/ui/Form'

export function VerificationBanner({ tutor, onOpen }) {
  const text = {
    pending: 'Upload your photo, identity document and qualification certificate to get verified.',
    documents_submitted: 'Thanks. Your documents are waiting for review.',
    under_review: 'Your documents are being reviewed.',
    verified: 'You are verified. Our team will activate your account shortly.',
    suspended: `Your account is suspended. ${tutor.statusNotes || 'Contact support.'}`,
    rejected: `Your application was not approved. ${tutor.statusNotes || ''}`,
  }[tutor.status]
  return (
    <Notice tone={['suspended', 'rejected'].includes(tutor.status) ? 'error' : 'warning'}>
      {text} {tutor.status === 'pending' && <button type="button" className="font-semibold underline" onClick={onOpen}>Upload documents</button>}
    </Notice>
  )
}
