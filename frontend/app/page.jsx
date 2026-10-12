'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiArrowRight, FiCheck, FiUsers, FiBook, FiTarget, FiAward } from 'react-icons/fi'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('parent')

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
    viewport: { once: true },
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="w-full overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold gradient-text">home tution</div>
          <div className="hidden md:flex gap-8">
            <Link href="#features" className="text-gray-600 hover:text-blue-600 transition">Features</Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition">How It Works</Link>
            <Link href="#contact" className="text-gray-600 hover:text-blue-600 transition">Contact</Link>
          </div>
          <Link href="/parent/register" className="btn-primary hidden sm:block">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 hero-gradient text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Find the Perfect Tutor Near You
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-lg">
              Connect with verified tutors in your area for home and online tuition. Personalized learning for every student.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/parent/register" className="btn bg-white text-blue-600 hover:bg-gray-100 inline-block text-center font-semibold">
                I'm a Parent <FiArrowRight className="inline ml-2" />
              </Link>
              <Link href="/tutor/register" className="btn border-2 border-white text-white hover:bg-white/10 inline-block text-center font-semibold">
                I'm a Tutor <FiArrowRight className="inline ml-2" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-96"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl opacity-20 blur-xl animate-pulse" />
            <div className="absolute inset-0 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/20 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold mb-4">5K+</div>
                <p className="text-white/90">Verified Tutors Ready to Help</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose home tution?</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need to find, book, and manage tutoring all in one place
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {[
              {
                icon: <FiTarget className="w-8 h-8" />,
                title: 'Smart Matching',
                desc: 'AI-powered algorithm matches students with the best tutors based on location, availability, and expertise'
              },
              {
                icon: <FiUsers className="w-8 h-8" />,
                title: 'Verified Tutors',
                desc: 'All tutors go through thorough verification to ensure quality and trust'
              },
              {
                icon: <FiBook className="w-8 h-8" />,
                title: 'Flexible Learning',
                desc: 'Home tuition, online classes, or hybrid - choose what works best for you'
              },
              {
                icon: <FiCheck className="w-8 h-8" />,
                title: 'Real Progress Tracking',
                desc: 'Monitor attendance, grades, and learning progress in real-time'
              },
              {
                icon: <FiAward className="w-8 h-8" />,
                title: 'Expert Support',
                desc: 'Dedicated support team to help with any questions or issues'
              },
              {
                icon: <FiArrowRight className="w-8 h-8" />,
                title: 'Instant Bookings',
                desc: 'Schedule demos and start classes immediately'
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="bg-white p-8 rounded-2xl card-shadow hover:card-shadow-lg transition-all duration-300 hover:translate-y-[-4px]"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Parent Flow */}
            <motion.div {...fadeInUp}>
              <h3 className="text-2xl font-bold mb-8 text-blue-600">For Parents</h3>
              {[
                { num: 1, title: 'Register', desc: 'Create an account and tell us about your child' },
                { num: 2, title: 'Get Matched', desc: 'We find the best tutors near you' },
                { num: 3, title: 'Demo Class', desc: 'Attend a free demo to meet the tutor' },
                { num: 4, title: 'Start Learning', desc: 'Begin regular classes and track progress' },
              ].map((step) => (
                <div key={step.num} className="flex gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{step.title}</h4>
                    <p className="text-gray-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Tutor Flow */}
            <motion.div {...fadeInUp}>
              <h3 className="text-2xl font-bold mb-8 text-purple-600">For Tutors</h3>
              {[
                { num: 1, title: 'Register', desc: 'Sign up and complete your profile' },
                { num: 2, title: 'Get Verified', desc: 'Submit documents for quick verification' },
                { num: 3, title: 'Receive Leads', desc: 'Get matched with interested students' },
                { num: 4, title: 'Earn', desc: 'Conduct classes and receive payments' },
              ].map((step) => (
                <div key={step.num} className="flex gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{step.title}</h4>
                    <p className="text-gray-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <motion.div className="max-w-4xl mx-auto text-center" {...fadeInUp}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg text-white/90 mb-8">Join thousands of students and tutors already learning on home tution</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/parent/register" className="btn bg-white text-blue-600 hover:bg-gray-100 inline-block font-semibold">
              Register as Parent
            </Link>
            <Link href="/tutor/register" className="btn border-2 border-white text-white hover:bg-white/10 inline-block font-semibold">
              Register as Tutor
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">home tution</h4>
              <p className="text-sm">Connecting students with perfect tutors</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm"><li><Link href="#" className="hover:text-white">Features</Link></li><li><Link href="#" className="hover:text-white">How It Works</Link></li></ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm"><li><Link href="#" className="hover:text-white">About</Link></li><li><Link href="#" className="hover:text-white">Blog</Link></li></ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm"><li><Link href="#" className="hover:text-white">Privacy</Link></li><li><Link href="#" className="hover:text-white">Terms</Link></li></ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; 2024 home tution. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
