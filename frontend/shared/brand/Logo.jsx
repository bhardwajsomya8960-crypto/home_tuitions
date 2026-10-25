// Brand artwork lives in public/brand (generated from the source logo at the repo root).
export const BRAND_NAME = 'Home & Online Tutor Hub'

// The house mark on its own, for compact places. Decorative: always pair it with the brand name.
export default function Logo({ className = 'w-9 h-9' }) {
  return <img src="/brand/logo-mark.webp" alt="" aria-hidden="true" width={256} height={256} className={`object-contain ${className}`} />
}

// The full logo with the wordmark. Its text is dark, so use it on light backgrounds only.
export function BrandLockup({ className = 'h-20 w-auto' }) {
  return <img src="/brand/logo.webp" alt={BRAND_NAME} width={720} height={390} className={className} />
}
