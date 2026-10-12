'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function TutorRegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setError('')

      const response = await axios.post(`${API_URL}/api/tutors/register`, {
        name: data.name,
        phone: data.phone,
        email: data.email,
        gender: data.gender,
        qualification: data.qualification,
        experience: parseInt(data.experience),
        subjects: data.subjects.split(',').map(s => s.trim()),
        classes: data.classes.split(',').map(c => parseInt(c.trim())),
        boards: data.boards.split(',').map(b => b.trim()),
        teachingLanguages: data.languages.split(',').map(l => l.trim()),
        teachingMode: data.mode.split(',').map(m => m.trim()),
        address: data.address,
        pincode: data.pincode,
        serviceRadius: parseInt(data.radius || 8),
      })

      setSuccess(true)
      console.log('Registration successful:', response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center card-shadow-lg"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">Please upload your KYC documents for verification</p>
          <Link href="/tutor/dashboard" className="btn-primary block">
            Go to Dashboard
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 pt-20 pb-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Become a Tutor</h1>
          <p className="text-gray-600">Start earning by helping students learn</p>
        </div>

        <div className="mb-8 flex gap-4">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 card-shadow-lg">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-2xl font-bold mb-6">Your Details</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    {...register('name', { required: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="Rahul Kumar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mobile Number *</label>
                  <input
                    type="tel"
                    {...register('phone', { required: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    {...register('email', { required: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Gender *</label>
                  <select
                    {...register('gender', { required: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Qualification *</label>
                    <select
                      {...register('qualification', { required: true })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="Bachelor">Bachelor</option>
                      <option value="Master">Master</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Experience (years) *</label>
                    <input
                      type="number"
                      {...register('experience', { required: true })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subjects (comma-separated) *</label>
                  <input
                    type="text"
                    {...register('subjects', { required: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="Maths, Science, English"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Classes (comma-separated) *</label>
                  <input
                    type="text"
                    {...register('classes', { required: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="6, 7, 8, 9, 10"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full btn-primary bg-purple-600 hover:bg-purple-700"
              >
                Next
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-2xl font-bold mb-6">Location & Availability</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Boards (comma-separated) *</label>
                  <input
                    type="text"
                    {...register('boards', { required: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="CBSE, ICSE, State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Teaching Languages (comma-separated) *</label>
                  <input
                    type="text"
                    {...register('languages', { required: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="English, Hindi, Marathi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Teaching Mode (comma-separated) *</label>
                  <input
                    type="text"
                    {...register('mode', { required: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="Home, Online, Both"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Pincode *</label>
                    <input
                      type="text"
                      {...register('pincode', { required: true })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Service Radius (km)</label>
                    <input
                      type="number"
                      {...register('radius')}
                      defaultValue="8"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      min="1"
                      max="50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address *</label>
                  <input
                    type="text"
                    {...register('address', { required: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="123 Main St"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 btn-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </motion.div>
          )}
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already registered? <Link href="/tutor/login" className="text-purple-600 font-semibold hover:underline">Login here</Link>
        </p>
      </motion.div>
    </div>
  )
}
