import Link from 'next/link'
import { FiArrowRight } from 'react-icons/fi'
import Logo, { BrandLockup, BRAND_NAME } from './Logo'
import Reveal from './Reveal'
import HeroArt from './HeroArt'
import LearningMatch from './LearningMatch'

const primaryBtn =
  'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-ink bg-lemon px-7 text-base font-semibold text-ink transition-transform duration-150 motion-safe:hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory'
const secondaryBtn =
  'inline-flex min-h-[52px] items-center justify-center rounded-full border border-ink/25 bg-transparent px-7 text-base font-semibold text-ink transition-colors hover:border-ink/60 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory'

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-2 md:gap-12 md:pb-24 md:pt-16">
      <div className="order-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage">Better learning starts here</p>
        <h1 className="mt-4 max-w-[16ch] text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
          Meet the tutor who makes learning click.
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-sage">
          Personalised home and online tuition that fits your child&apos;s needs, schedule, and goals.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/parent/register" className={primaryBtn}>
            Find My Tutor
            <FiArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/tutor/register" className={secondaryBtn}>I&apos;m a Tutor</Link>
        </div>
        <p className="mt-5 text-sm text-sage">Home &amp; online classes · Tell us what you need</p>
      </div>
      <div className="order-2">
        <HeroArt />
      </div>
    </section>
  )
}

export function LearningMatchSection() {
  return (
    <section id="learning-match" aria-labelledby="learning-match-title" className="scroll-mt-20 bg-white/60 border-y border-ink/5">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage">Start here</p>
          <h2 id="learning-match-title" className="mt-3 max-w-[22ch] text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Tell us about your child in three taps.
          </h2>
          <p className="mt-3 max-w-[50ch] text-base leading-relaxed text-sage">
            A quick starting point. You can skip this and go straight to the enquiry form.
          </p>
        </Reveal>
        <Reveal delay={0.08} className="mt-8">
          <LearningMatch />
        </Reveal>
      </div>
    </section>
  )
}

const STEPS = [
  { title: 'Tell us what your child needs', body: 'Share the class, subjects, and how you would like lessons to run.' },
  { title: 'Explore suitable tutor options', body: 'Look at the tutors that fit what you asked for, and choose the one you like.' },
  { title: 'Start learning with confidence', body: 'Begin lessons at home or online, on a schedule that suits your family.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <h2 id="how-title" className="max-w-[24ch] text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Three little steps to a better learning fit.
        </h2>
      </Reveal>
      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.08} className="h-full">
            <li className="flex h-full list-none flex-col rounded-3xl border border-ink/10 bg-white p-6 sm:p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lemon text-lg font-extrabold text-ink" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-sage">{step.body}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true" focusable="false">
      <path d="M12 30 L32 14 L52 30 V50 H12 Z" fill="#E7DEFF" stroke="#26352F" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="27" y="36" width="10" height="14" rx="2" fill="#F7E96B" stroke="#26352F" strokeWidth="2.5" />
    </svg>
  )
}

function OnlineIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true" focusable="false">
      <rect x="10" y="14" width="44" height="30" rx="4" fill="#CDEDD8" stroke="#26352F" strokeWidth="2.5" />
      <path d="M26 52 H38 M32 44 V52" stroke="#26352F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 27 L36 21 L36 33 Z" fill="#F7E96B" stroke="#26352F" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

export function HomeOrOnline() {
  const panels = [
    { title: 'Home Tuition', body: 'Personal attention, right where your child feels comfortable.', icon: <HomeIcon />, href: '/parent/register?mode=Home', tint: 'bg-lavender/50' },
    { title: 'Online Tuition', body: 'Flexible learning from wherever you are.', icon: <OnlineIcon />, href: '/parent/register?mode=Online', tint: 'bg-mint/60' },
  ]
  return (
    <section aria-labelledby="home-online-title" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
      <Reveal>
        <h2 id="home-online-title" className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Home or online?</h2>
      </Reveal>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {panels.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.08} className="h-full">
            <article className={`flex h-full flex-col rounded-3xl p-7 sm:p-8 ${p.tint}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-ink">{p.title}</h3>
                  <p className="mt-2 max-w-[32ch] text-base leading-relaxed text-ink/80">{p.body}</p>
                </div>
                {p.icon}
              </div>
              <Link href={p.href} className={`${secondaryBtn} mt-7 self-start bg-white/80`}>
                Choose {p.title.split(' ')[0]}
              </Link>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function ForTutors() {
  return (
    <section id="for-tutors" aria-labelledby="tutors-title" className="scroll-mt-20 bg-mint">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-20">
        <Reveal>
          <h2 id="tutors-title" className="max-w-[20ch] text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Good at teaching? Let&apos;s help you teach more.
          </h2>
          <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-ink/85">
            Discover teaching opportunities that fit your subjects, availability, and preferences.
          </p>
          <Link href="/tutor/register" className={`${primaryBtn} mt-8`}>
            Join as a Tutor
            <FiArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
        <Reveal delay={0.1} className="flex justify-center">
          <svg viewBox="0 0 280 220" className="w-full max-w-[300px]" aria-hidden="true" focusable="false">
            <rect x="30" y="40" width="200" height="150" rx="20" fill="#FFFFFF" stroke="#26352F" strokeWidth="2" />
            <circle cx="210" cy="50" r="28" fill="#F7E96B" stroke="#26352F" strokeWidth="2" />
            <path d="M52 92 H180 M52 118 H160 M52 144 H172" stroke="#CDEDD8" strokeWidth="6" strokeLinecap="round" />
            <path d="M190 160 L210 140 L236 166 L216 186 Z" fill="#FFAB91" stroke="#26352F" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </Reveal>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section aria-labelledby="final-title" className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 md:py-28">
      <Reveal className="flex flex-col items-center">
        <Logo className="h-24 w-24" />
        <h2 id="final-title" className="mt-6 max-w-[22ch] text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Let&apos;s make learning feel a little easier.
        </h2>
        <p className="mt-4 max-w-[44ch] text-lg text-sage">
          Start with what your child needs. We&apos;ll help you take the next step.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Link href="/parent/register" className={primaryBtn}>
            Find My Tutor
            <FiArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/tutor/register" className="rounded-md px-2 py-2 text-base font-semibold text-ink underline decoration-lemon decoration-4 underline-offset-4 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink">
            Teach with Us
          </Link>
        </div>
      </Reveal>
    </section>
  )
}

export function SiteFooter() {
  const year = new Date().getFullYear()
  const linkClass = 'text-ink/80 hover:text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-sm'
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <BrandLockup className="h-16 w-auto" />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
          <a href="#learning-match" className={linkClass}>Find a Tutor</a>
          <a href="#how-it-works" className={linkClass}>How It Works</a>
          <Link href="/tutor/register" className={linkClass}>Become a Tutor</Link>
          <Link href="/parent/register" className={linkClass}>Find My Tutor</Link>
        </nav>
        <p className="text-sm text-sage">© {year} {BRAND_NAME}</p>
      </div>
    </footer>
  )
}
