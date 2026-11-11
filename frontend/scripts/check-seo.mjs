#!/usr/bin/env node
// SEO and structured-data check for the public website. It loads every public page from a
// running copy of the site (sitemap pages, pages linked from them, and blog drafts) and checks:
//   - each JSON-LD block parses, has @context https://schema.org and the fields its @type needs
//     (Organization, LocalBusiness, BreadcrumbList, FAQPage, Article); FAQ markup must match
//     the visible FAQ text exactly; breadcrumbs end at the page's canonical URL
//   - title ≤ 60 and description ≤ 155 characters, both unique; canonical, Open Graph
//     (property=) and Twitter (name=) tags; the share image loads; no meta keywords
//   - every #anchor link points to an id that exists; every <img> has an alt attribute
//   - sitemap.xml lists exactly the indexable pages, each with <lastmod>; robots.txt points to it
//   - indexable area pages have an 80–150 word intro of their own
//
// Usage (from frontend/):  npm run build && npm start      then, in another terminal:
//                          npm run check:seo [-- http://localhost:3000] [-- --print /noida,/noida/sector-62]
import { readdirSync, existsSync } from 'node:fs'

const args = process.argv.slice(2)
const base = new URL(args.find(a => /^https?:\/\//.test(a)) || process.env.SEO_BASE_URL || 'http://localhost:3000')
const printPaths = (args[args.indexOf('--print') + 1] || '').split(',').filter(p => args.includes('--print') && p.startsWith('/'))
const SKIP = /^\/(api|admin|parent|tutor|login|_next)(\/|$)|\.[a-z0-9]+$/i

const errors = []
const warnings = []
const fail = (page, msg) => errors.push(`${page}: ${msg}`)
const warn = (page, msg) => warnings.push(`${page}: ${msg}`)

const decode = s => s
  .replace(/<!--.*?-->/gs, '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
const text = html => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], decode(m[2])]))
const words = s => s.split(/\s+/).filter(Boolean).length

const cache = new Map()
async function load(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(new URL(path, base), { redirect: 'manual' }).then(async res => ({ status: res.status, type: res.headers.get('content-type') || '', body: await res.text() })))
  }
  return cache.get(path)
}

function parsePage(html) {
  const head = html.slice(0, html.indexOf('</head>') + 1 || html.length)
  const metas = [...head.matchAll(/<meta\s[^>]*>/g)].map(m => attrs(m[0]))
  const meta = key => metas.find(m => m.name === key || m.property === key)
  return {
    title: decode((head.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''),
    description: meta('description')?.content || '',
    canonical: attrs((head.match(/<link[^>]*rel="canonical"[^>]*>/) || [''])[0]).href || '',
    robots: meta('robots')?.content || '',
    metas,
    meta,
    jsonLd: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]),
    ids: new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1])),
    hrefs: [...html.matchAll(/<a\s[^>]*href="([^"]+)"/g)].map(m => decode(m[1])),
    imgs: [...html.matchAll(/<img\s[^>]*>/g)].map(m => m[0]),
    faq: [...html.matchAll(/<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => ({ q: text(m[1]), a: text(m[2]) })),
    areaIntro: (html.match(/<p data-area-intro[^>]*>([\s\S]*?)<\/p>/) || [])[1],
  }
}

const isoDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s) && !Number.isNaN(Date.parse(s))
const types = node => [].concat(node['@type'] || [])

function checkJsonLd(path, page, sitemapOrigin) {
  const blocks = []
  for (const raw of page.jsonLd) {
    let data
    try { data = JSON.parse(raw) } catch (e) { fail(path, `JSON-LD does not parse: ${e.message}`); continue }
    blocks.push(data)
    if (data['@context'] !== 'https://schema.org') fail(path, `JSON-LD ${types(data)} has @context ${data['@context']}`)
    if (!types(data).length) fail(path, 'JSON-LD without @type')
    const t = types(data)
    const need = (cond, msg) => { if (!cond) fail(path, `${t.join('/')}: ${msg}`) }
    if (t.includes('Organization')) {
      need(data.name && /^https?:\/\//.test(data.url || ''), 'needs name and an absolute url')
      need(/^https?:\/\//.test(data.logo?.url || data.logo || ''), 'needs a logo URL')
    }
    if (t.includes('LocalBusiness')) {
      need(data.name && /^https?:\/\//.test(data.url || '') && /^\+\d{10,15}$/.test(data.telephone || ''), 'needs name, absolute url and an E.164 telephone')
      need(Array.isArray(data.areaServed) && data.areaServed.length && data.areaServed.every(p => p['@type'] === 'Place' && p.name), 'areaServed must be Place objects')
      need(!data.aggregateRating && !data.review, 'must not carry ratings or reviews without real review data')
      need(!data.address || data.address['@type'] === 'PostalAddress', 'address must be a PostalAddress')
      need(!data.sameAs || (Array.isArray(data.sameAs) && data.sameAs.every(u => /^https:\/\//.test(u))), 'sameAs must be https URLs')
    }
    if (t.includes('BreadcrumbList')) {
      const items = data.itemListElement || []
      need(items.length >= 2 && items.every((it, i) => it.position === i + 1 && it.name && /^https?:\/\//.test(it.item || '')), 'items need position 1..n, a name and an absolute item URL')
      const last = items[items.length - 1]?.item
      need(!page.canonical || last === page.canonical, `last item ${last} is not the canonical URL ${page.canonical}`)
    }
    if (t.includes('FAQPage')) {
      const marked = (data.mainEntity || []).map(q => ({ q: q.name, a: q.acceptedAnswer?.text }))
      need(marked.length && marked.every(q => q.q && q.a), 'every Question needs name and acceptedAnswer.text')
      need(JSON.stringify(marked) === JSON.stringify(page.faq), `markup does not match the visible FAQ (${marked.length} marked, ${page.faq.length} visible)`)
    }
    if (t.includes('Article')) {
      need(data.headline && data.headline.length <= 110, 'needs a headline of at most 110 characters')
      need(data.author?.name, 'needs author.name')
      need(isoDate(data.datePublished) && (!data.dateModified || isoDate(data.dateModified)), 'needs ISO datePublished (and dateModified)')
      need(Array.isArray(data.image) ? data.image.length : data.image, 'needs an image')
      need(data.publisher?.name, 'needs publisher.name')
    }
  }
  return blocks
}

async function main() {
  // robots.txt and sitemap.xml
  const robots = await load('/robots.txt')
  const sitemapLine = (robots.body.match(/^Sitemap:\s*(\S+)/mi) || [])[1]
  if (robots.status !== 200 || !sitemapLine || !sitemapLine.endsWith('/sitemap.xml')) fail('/robots.txt', 'must reference /sitemap.xml')
  const sitemap = await load('/sitemap.xml')
  const entries = [...sitemap.body.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => ({ loc: (m[1].match(/<loc>(.*?)<\/loc>/) || [])[1], lastmod: (m[1].match(/<lastmod>(.*?)<\/lastmod>/) || [])[1] }))
  if (!entries.length) fail('/sitemap.xml', 'has no URLs')
  const siteOrigin = entries[0] ? new URL(entries[0].loc).origin : base.origin
  const inSitemap = new Set()
  for (const e of entries) {
    if (!e.lastmod || Number.isNaN(Date.parse(e.lastmod))) fail('/sitemap.xml', `${e.loc} has no valid <lastmod>`)
    inSitemap.add(new URL(e.loc).pathname)
  }

  // Pages: the sitemap, everything linked from those pages, and blog drafts (not linked).
  const queue = [...inSitemap, '/how-we-verify', '/blog', '/become-a-tutor', '/tutors-near-me', '/tutors-near-me?city=Lucknow']
  const blogDir = new URL('../content/blog/', import.meta.url)
  if (existsSync(blogDir)) for (const f of readdirSync(blogDir)) if (f.endsWith('.md')) queue.push(`/blog/${f.slice(0, -3)}`)
  const seen = new Set()
  const pages = new Map()
  while (queue.length && seen.size < 300) {
    const path = queue.shift()
    if (seen.has(path)) continue
    seen.add(path)
    const res = await load(path)
    if (res.status === 404 && !inSitemap.has(path) && ['/how-we-verify', '/blog'].includes(path)) continue // switched off
    if (res.status !== 200) { fail(path, `HTTP ${res.status}`); continue }
    const page = parsePage(res.body)
    pages.set(path, page)
    for (const href of page.hrefs) {
      if (!href.startsWith('/') || href.startsWith('//')) continue
      const u = new URL(href, base)
      if (!u.search && !SKIP.test(u.pathname) && !seen.has(u.pathname)) queue.push(u.pathname)
    }
  }

  const titles = new Map()
  const descriptions = new Map()
  const intros = new Map()
  let shareImageChecked = false
  for (const [path, page] of pages) {
    const noindex = /noindex/i.test(page.robots)
    if (!page.title) fail(path, 'no <title>')
    else if (page.title.length > 60) fail(path, `title is ${page.title.length} characters (max 60): "${page.title}"`)
    if (!page.description) fail(path, 'no meta description')
    else if (page.description.length > 155) fail(path, `description is ${page.description.length} characters (max 155)`)
    titles.set(page.title, [...(titles.get(page.title) || []), path])
    descriptions.set(page.description, [...(descriptions.get(page.description) || []), path])
    if (!/^https:\/\//.test(page.canonical)) fail(path, `canonical URL missing or not absolute: "${page.canonical}"`)
    if (page.meta('keywords')) fail(path, 'has a meta keywords tag')
    for (const key of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height']) {
      if (!page.metas.some(m => m.property === key && m.content)) fail(path, `missing <meta property="${key}">`)
    }
    if (page.meta('og:image:width')?.content !== '1200' || page.meta('og:image:height')?.content !== '630') fail(path, 'og:image is not 1200x630')
    for (const key of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
      if (!page.metas.some(m => m.name === key && m.content)) fail(path, `missing <meta name="${key}">`)
    }
    if (page.metas.some(m => m.name?.startsWith('og:') || m.property?.startsWith('twitter:'))) fail(path, 'Open Graph tags must use property=, Twitter tags name=')
    if (!shareImageChecked && page.meta('og:image')) {
      shareImageChecked = true
      const img = new URL(page.meta('og:image').content)
      const res = await load(img.pathname + img.search)
      if (res.status !== 200 || !res.type.startsWith('image/')) fail(path, `og:image ${img.pathname} does not load as an image`)
    }
    for (const tag of page.imgs) if (!/\salt="/.test(tag)) fail(path, `<img> without alt: ${tag.slice(0, 80)}`)

    // Anchors: "#x" must exist here; "/page#x" must exist on that page.
    for (const href of page.hrefs) {
      const hash = href.match(/^([^#]*)#(.+)$/)
      if (!hash) continue
      const target = hash[1] === '' ? path : hash[1]
      if (!target.startsWith('/')) continue
      const targetPath = new URL(target, base).pathname
      const targetPage = targetPath === path ? page : pages.get(targetPath) || parsePage((await load(targetPath)).body)
      if (!targetPage.ids.has(hash[2])) fail(path, `link ${href} points to #${hash[2]}, which does not exist on ${targetPath}`)
    }

    // Sitemap agreement.
    if (noindex && inSitemap.has(path)) fail(path, 'is noindex but listed in sitemap.xml')
    if (!noindex && !inSitemap.has(path)) fail(path, 'is indexable but missing from sitemap.xml')

    // Area pages: an indexable one needs its own 80–150 word intro.
    if (page.areaIntro !== undefined) {
      const intro = text(page.areaIntro)
      if (!noindex) {
        const n = words(intro)
        if (n < 80 || n > 150) fail(path, `indexable area page intro has ${n} words (needs 80–150)`)
        if (intros.has(intro)) fail(path, `intro is the same as on ${intros.get(intro)}`)
        intros.set(intro, path)
      }
    }

    const blocks = checkJsonLd(path, page, siteOrigin)
    if (!blocks.some(b => types(b).includes('Organization'))) fail(path, 'no Organization JSON-LD')
    if (/^\/(noida|delhi)(\/|$)/.test(path) || page.areaIntro !== undefined) {
      for (const t of ['LocalBusiness', 'BreadcrumbList']) if (!blocks.some(b => types(b).includes(t))) fail(path, `no ${t} JSON-LD`)
    }
    if (page.faq.length && !blocks.some(b => types(b).includes('FAQPage'))) warn(path, 'visible FAQ without FAQPage markup')
    if (printPaths.includes(path)) {
      console.log(`\n===== JSON-LD on ${path} =====`)
      for (const b of blocks) console.log(JSON.stringify(b, null, 2))
    }
  }
  for (const [title, paths] of titles) if (title && paths.length > 1) fail(paths.join(', '), `share the title "${title}"`)
  for (const [desc, paths] of descriptions) if (desc && paths.length > 1) fail(paths.join(', '), `share the description "${desc.slice(0, 60)}…"`)
  for (const loc of inSitemap) if (!pages.has(loc)) fail(loc, 'listed in sitemap.xml but did not load')

  const noindexCount = [...pages.values()].filter(p => /noindex/i.test(p.robots)).length
  console.log(`\nChecked ${pages.size} pages against ${base.origin} (${inSitemap.size} in sitemap, ${noindexCount} noindex).`)
  for (const w of warnings) console.log(`  warning  ${w}`)
  for (const e of errors) console.log(`  ERROR    ${e}`)
  console.log(errors.length ? `\n${errors.length} problem(s) found.` : '\nAll checks passed.')
  process.exit(errors.length ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
