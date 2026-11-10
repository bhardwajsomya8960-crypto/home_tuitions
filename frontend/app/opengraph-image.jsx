import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { CONTACT, SERVICE_AREA } from '@/features/website/contact'
import { SHARE_IMAGE_ALT } from '@/shared/lib/seo'

// The default share image (1200 x 630) for every page: Facebook, WhatsApp and LinkedIn previews
// (og:image) and Twitter/X cards (twitter-image.jsx reuses it). Rendered once at build time
// from the brand logo in public/brand.
export const alt = SHARE_IMAGE_ALT
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), 'public/brand/logo.png'))
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#FFFCF4', color: '#26352F' }}>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', padding: '56px 64px', gap: 44 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered to a PNG, not a web page */}
          <img src={logoSrc} width={430} height={233} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
            <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.1 }}>{`Home tutors in ${SERVICE_AREA}`}</div>
            <div style={{ fontSize: 28, color: '#5E7163', lineHeight: 1.35 }}>Class 1–12 · Evening and weekend slots · Free demo class</div>
            <div style={{ display: 'flex', alignSelf: 'flex-start', marginTop: 8, padding: '12px 26px', borderRadius: 999, border: '3px solid #26352F', background: '#F7E96B', fontSize: 27, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {`Call or WhatsApp ${CONTACT.phone}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', height: 18, background: '#CDEDD8' }} />
      </div>
    ),
    size,
  )
}
