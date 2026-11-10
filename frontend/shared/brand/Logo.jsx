// Brand artwork lives in public/brand (generated from the source logo at the repo root).
export const BRAND_NAME = 'Home & Online Tutor Hub'

// The house mark on its own, for compact places. Decorative by default (pair it with the brand
// name); pass `alt` when it stands alone, e.g. as the header's home link.
export default function Logo({ className = 'w-9 h-9', alt = '' }) {
  return <img src="/brand/logo-mark.webp" alt={alt} aria-hidden={alt ? undefined : 'true'} width={256} height={256} className={`object-contain ${className}`} />
}

// The full logo with the wordmark. Its text is dark, so use it on light backgrounds only.
// `loading="lazy"` for places below the fold, such as the footer.
export function BrandLockup({ className = 'h-20 w-auto', loading }) {
  return <img src="/brand/logo.webp" alt={BRAND_NAME} width={720} height={390} loading={loading} decoding="async" className={className} />
}
