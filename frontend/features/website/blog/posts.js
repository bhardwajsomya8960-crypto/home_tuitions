import fs from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'
import { getCity } from '@/features/website/cities/cities.config'

// Blog posts are Markdown files in frontend/content/blog/<slug>.md, read at build time (the
// blog pages are static). Each file starts with front matter between --- lines:
//   title        required; keep it short (the page title adds " | Home & Online Tutor Hub" when it fits in 60 characters)
//   description  required; at most 155 characters, shown in search results
//   author       required; authorType: person (default) or organization
//   date         required, YYYY-MM-DD; updated: optional, YYYY-MM-DD
//   city         optional city slug (noida, delhi) for the "find a tutor" box at the end
//   draft        true keeps the post off the blog list and the sitemap, and noindex
// Posts are written by the team, so their Markdown (including any HTML) is trusted.
const DIR = path.join(process.cwd(), 'content', 'blog')
const DATE = /^\d{4}-\d{2}-\d{2}$/

function parsePost(file) {
  const where = `content/blog/${file}`
  const source = fs.readFileSync(path.join(DIR, file), 'utf8')
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) throw new Error(`${where}: front matter (--- … ---) is missing`)
  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z]\w*):\s*(.*)$/)
    if (!kv) continue
    let value = kv[2].trim()
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1)
    else if (value === 'true' || value === 'false') value = value === 'true'
    data[kv[1]] = value
  }
  const slug = file.replace(/\.md$/, '')
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`${where}: use lowercase letters, numbers and hyphens in the file name`)
  for (const key of ['title', 'description', 'author', 'date']) if (!data[key]) throw new Error(`${where}: "${key}" is required`)
  for (const key of ['date', 'updated']) if (data[key] && !DATE.test(data[key])) throw new Error(`${where}: "${key}" must be YYYY-MM-DD`)
  if (data.city && !getCity(data.city)) throw new Error(`${where}: unknown city "${data.city}"`)
  return {
    slug,
    title: data.title,
    description: data.description,
    author: data.author,
    authorType: data.authorType === 'organization' ? 'organization' : 'person',
    date: data.date,
    updated: data.updated || data.date,
    city: data.city || null,
    draft: data.draft === true,
    html: marked.parse(match[2]),
  }
}

let cache = null
export function getAllPosts() {
  cache ||= fs.existsSync(DIR)
    ? fs.readdirSync(DIR).filter(f => f.endsWith('.md')).map(parsePost).sort((a, b) => b.date.localeCompare(a.date))
    : []
  return cache
}

export const getPublishedPosts = () => getAllPosts().filter(post => !post.draft)
export const getPost = slug => getAllPosts().find(post => post.slug === slug) || null

export const formatDate = iso => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
