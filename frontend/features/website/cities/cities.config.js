// City landing pages (/noida, /delhi, and area pages such as /noida/sector-62) are built from
// this file. Adding a city means adding one entry to CITIES; see "Adding a new city" in the
// repository README. Plain data only, so both server and browser code can import it.

// When false, every "verified" / "ID-checked" claim is hidden on the city pages: the word
// "Verified" in headings, the ID-check card, the verification steps and that FAQ, and the
// /how-we-verify page with every link to it.
export const VERIFICATION_ENABLED = true

export const DEFAULT_WHATSAPP = '+918960274119'

// The ad landing page that greets visitors with their own city (app/tutors-near-me).
export const NEAR_ME_PATH = '/tutors-near-me'

// Each city:
//   slug                  the address: /noida
//   name, nameHindi       shown on the page (the Hindi name sits above the heading)
//   aliases               other names the visitor's location may report for this city
//                         (e.g. 'New Delhi'); /tutors-near-me sends them to this page
//   intro                 a paragraph written for this city. Write it fresh for each city:
//                         mention its localities and how families there live and commute.
//   tutorCount            number of tutors we actually have there, or null to hide the stat.
//                         Never estimate it.
//   homeTuitionAvailable  false shows the page as online tuition only (no home visits).
//   whatsappNumber        with country code; defaults to the business number.
//   address               a public street address for this city, as schema.org PostalAddress
//                         fields ({ streetAddress, addressLocality, postalCode, addressRegion,
//                         addressCountry: 'IN' }), or null. Only set it if customers can visit it.
//   seo                   search result title (max 60 characters) and description (max 155).
//   areas                 localities we serve, one page each at /<city>/<area slug>:
//     name, slug          "Sector 62", "sector-62"
//     shortName           optional shorter name for titles (e.g. "Noida Extension")
//     intro               80–150 words written for this area only: what the locality is like,
//                         where families live, how we reach it. Leave '' until written.
//     nearbyLandmarks     real landmarks near the area, e.g. ['Sector 62 metro station'].
//     nearbyAreas         slugs of neighbouring areas in this city, e.g. ['sector-63'].
//     schoolsNearby       names of schools nearby, names only. Never imply an affiliation.
//     notes               internal notes for whoever writes the content; never shown.
//     indexable           true once the intro is written (80–150 words). Until then the page
//                         is noindex and left out of the sitemap, so near-identical pages do
//                         not compete with the city page.
//   Never invent landmarks, schools or neighbours: leave them empty until you have real data.
export const CITIES = [
  {
    slug: 'noida',
    name: 'Noida',
    nameHindi: 'नोएडा',
    intro: 'Noida is planned in sectors, and most families here plan their week around office hours. Whether you live in the older markets of Sector 15 and 18, near the offices of Sector 62, in the large societies of Sectors 76 to 78 and 137, or in a new tower in Noida Extension, tell us your sector and we look for a tutor who can reach it in the evening. Class can start after you are back from work, not in the middle of your commute.',
    tutorCount: null, // TODO(tutor count): set the real number of tutors here once known; null hides the stat.
    homeTuitionAvailable: true,
    whatsappNumber: DEFAULT_WHATSAPP,
    address: null, // TODO(address): a public address in Noida, only if customers can visit it.
    seo: {
      title: 'Home Tutors in Noida | Free Demo Class',
      description: 'Home tutors for Class 1–12 across Noida sectors and Noida Extension. Evening and weekend classes after office hours, with a free demo class first.',
    },
    areas: [
      // TODO(area content): for every area below, write the intro (80–150 words, unique), add real
      // nearbyLandmarks / nearbyAreas / schoolsNearby, then set indexable: true.
      { name: 'Sector 15', slug: 'sector-15', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Sector 18', slug: 'sector-18', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Sector 50', slug: 'sector-50', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Sector 62', slug: 'sector-62', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Sector 76', slug: 'sector-76', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Sector 77', slug: 'sector-77', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Sector 78', slug: 'sector-78', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Sector 137', slug: 'sector-137', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Sector 150', slug: 'sector-150', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Noida Extension (Greater Noida West)', shortName: 'Noida Extension', slug: 'noida-extension', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
    ],
  },
  {
    slug: 'delhi',
    name: 'Delhi',
    nameHindi: 'दिल्ली',
    aliases: ['New Delhi'],
    intro: 'Delhi is a long city to cross after a working day, so we keep tuition close to home. We match families in Dwarka and Janakpuri in the west, Rohini in the north, Laxmi Nagar, Preet Vihar, Mayur Vihar and IP Extension across the Yamuna, and Saket in the south with tutors who can reach their colony, so evening classes are not lost to traffic.',
    tutorCount: null, // TODO(tutor count): set the real number of tutors here once known; null hides the stat.
    homeTuitionAvailable: true,
    whatsappNumber: DEFAULT_WHATSAPP,
    address: null, // TODO(address): a public address in Delhi, only if customers can visit it.
    seo: {
      title: 'Home Tutors in Delhi | Free Demo Class',
      description: 'Home tutors for Class 1–12 in Dwarka, Rohini, Janakpuri, Laxmi Nagar, Mayur Vihar, Saket and more. Evening and weekend classes, free demo first.',
    },
    areas: [
      // TODO(area content): as for Noida above.
      { name: 'Dwarka', slug: 'dwarka', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Mayur Vihar', slug: 'mayur-vihar', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'IP Extension', slug: 'ip-extension', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Laxmi Nagar', slug: 'laxmi-nagar', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Preet Vihar', slug: 'preet-vihar', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Rohini', slug: 'rohini', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Janakpuri', slug: 'janakpuri', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
      { name: 'Saket', slug: 'saket', intro: '', nearbyLandmarks: [], nearbyAreas: [], schoolsNearby: [], notes: '', indexable: false },
    ],
  },
]

export const getCity = slug => CITIES.find(c => c.slug === slug) || null
export const getArea = (city, areaSlug) => city?.areas.find(a => a.slug === areaSlug) || null
// City pages, area pages and the near-me page (they share the template and its phone bar).
export const isCityPath = pathname => pathname === NEAR_ME_PATH || CITIES.some(c => pathname === `/${c.slug}` || pathname.startsWith(`/${c.slug}/`))

// The configured city a place name refers to ("noida", "New Delhi" → Delhi), or null.
export function findCityByName(name) {
  const key = (name || '').trim().toLowerCase()
  if (!key) return null
  return CITIES.find(c => [c.name, c.slug, ...(c.aliases || [])].some(n => n.toLowerCase() === key)) || null
}
