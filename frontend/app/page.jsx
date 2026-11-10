import SiteHeader from '@/features/website/components/landing/SiteHeader'
import MotionRoot from '@/features/website/components/landing/MotionRoot'
import { Hero, LearningMatchSection, HowItWorks, HomeOrOnline, ForTutors, FinalCta, SiteFooter } from '@/features/website/components/landing/Sections'
import CategoryDiscovery from '@/features/website/components/landing/CategoryDiscovery'
import EnquirySection from '@/features/website/components/landing/EnquirySection'
import { pageMetadata } from '@/shared/lib/seo'

// Static: the course catalogue it shows is part of the website (features/website/catalogue).
export const metadata = pageMetadata({
  title: 'Home Tutors in Noida & Delhi NCR | Home & Online Tutor Hub',
  description: 'Find home and online tutors for your child in Noida and Delhi NCR. Leave your number and we will call you back to find the right tutor.',
  path: '/',
})

export default function HomePage() {
  return (
    <MotionRoot>
      <div className="min-h-screen bg-ivory font-landing text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-lemon focus:px-4 focus:py-2 focus:font-semibold focus:text-ink focus:outline-none focus:ring-2 focus:ring-ink"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">
          <Hero />
          <EnquirySection />
          <CategoryDiscovery />
          <LearningMatchSection />
          <HowItWorks />
          <HomeOrOnline />
          <ForTutors />
          <FinalCta />
        </main>
        <SiteFooter />
      </div>
    </MotionRoot>
  )
}
