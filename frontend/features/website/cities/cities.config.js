// City landing pages (/noida, /delhi, and area pages such as /noida/sector-62) are built from
// this file. Adding a city means adding one entry to CITIES; see "Adding a new city" in the
// repository README. Plain data only, so both server and browser code can import it.

// When false, every "verified" / "ID-checked" claim is hidden on the city pages: the word
// "Verified" in headings and titles, the ID-check card, the verification steps and that FAQ.
export const VERIFICATION_ENABLED = true

export const DEFAULT_WHATSAPP = '+918960274119'

// Each city:
//   slug                  the address: /noida
//   name, nameHindi       shown on the page (the Hindi name sits above the heading)
//   areas                 localities we serve, as { name, slug }. Each one gets a page at
//                         /<city>/<area slug>. Give an area its own `intro` (a few sentences
//                         about that locality) to have its page indexed by search engines and
//                         listed in the sitemap; without one it is noindex, so near-identical
//                         pages do not compete with the city page.
//   intro                 a paragraph written for this city. Write it fresh for each city:
//                         mention its localities and how families there live and commute.
//   tutorCount            number of tutors we actually have there, or null to hide the stat.
//                         Never estimate it.
//   homeTuitionAvailable  false shows the page as online tuition only (no home visits).
//   whatsappNumber        with country code; defaults to the business number.
//   seo                   the search result title and description. They may say "Verified";
//                         when VERIFICATION_ENABLED is false, neutral defaults are used instead.
export const CITIES = [
  {
    slug: 'noida',
    name: 'Noida',
    nameHindi: 'नोएडा',
    areas: [
      { name: 'Sector 15', slug: 'sector-15' },
      { name: 'Sector 18', slug: 'sector-18' },
      { name: 'Sector 50', slug: 'sector-50' },
      { name: 'Sector 62', slug: 'sector-62' },
      { name: 'Sector 76', slug: 'sector-76' },
      { name: 'Sector 77', slug: 'sector-77' },
      { name: 'Sector 78', slug: 'sector-78' },
      { name: 'Sector 137', slug: 'sector-137' },
      { name: 'Sector 150', slug: 'sector-150' },
      { name: 'Noida Extension (Greater Noida West)', slug: 'noida-extension' },
    ],
    intro: 'Noida is planned in sectors, and most families here plan their week around office hours. Whether you live in the older markets of Sector 15 and 18, near the offices of Sector 62, in the large societies of Sectors 76 to 78 and 137, or in a new tower in Noida Extension, tell us your sector and we look for a tutor who can reach it in the evening. Class can start after you are back from work, not in the middle of your commute.',
    tutorCount: null, // TODO(tutor count): set the real number of tutors here once known; null hides the stat.
    homeTuitionAvailable: true,
    whatsappNumber: DEFAULT_WHATSAPP,
    seo: {
      title: 'Home Tutors in Noida | Verified, Free Demo | Home & Online Tutor Hub',
      description: 'Home tutors for Class 1 to 12 in Noida sectors and Noida Extension. Evening and weekend classes after office hours, with a free demo class first.',
    },
  },
  {
    slug: 'delhi',
    name: 'Delhi',
    nameHindi: 'दिल्ली',
    areas: [
      { name: 'Dwarka', slug: 'dwarka' },
      { name: 'Mayur Vihar', slug: 'mayur-vihar' },
      { name: 'IP Extension', slug: 'ip-extension' },
      { name: 'Laxmi Nagar', slug: 'laxmi-nagar' },
      { name: 'Preet Vihar', slug: 'preet-vihar' },
      { name: 'Rohini', slug: 'rohini' },
      { name: 'Janakpuri', slug: 'janakpuri' },
      { name: 'Saket', slug: 'saket' },
    ],
    intro: 'Delhi is a long city to cross after a working day, so we keep tuition close to home. We match families in Dwarka and Janakpuri in the west, Rohini in the north, Laxmi Nagar, Preet Vihar, Mayur Vihar and IP Extension across the Yamuna, and Saket in the south with tutors who can reach their colony, so evening classes are not lost to traffic.',
    tutorCount: null, // TODO(tutor count): set the real number of tutors here once known; null hides the stat.
    homeTuitionAvailable: true,
    whatsappNumber: DEFAULT_WHATSAPP,
    seo: {
      title: 'Home Tutors in Delhi | Verified, Free Demo | Home & Online Tutor Hub',
      description: 'Home tutors for Class 1 to 12 in Dwarka, Rohini, Janakpuri, Laxmi Nagar, Mayur Vihar, Saket and more. Evening and weekend classes, with a free demo class first.',
    },
  },
]

export const getCity = slug => CITIES.find(c => c.slug === slug) || null
export const getArea = (city, areaSlug) => city?.areas.find(a => a.slug === areaSlug) || null
export const isCityPath = pathname => CITIES.some(c => pathname === `/${c.slug}` || pathname.startsWith(`/${c.slug}/`))
