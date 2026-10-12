'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { FiUsers, FiTrendingUp, FiCheck, FiAlertCircle } from 'react-icons/fi'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    totalTutors: 0,
    activeTutors: 0,
    pendingVerification: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  })
  const [loading, setLoading] = useState(true)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin/dashboard`)
        setStats(response.data)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg p-6 card-shadow hover:card-shadow-lg transition-all`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{loading ? '-' : value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white text-xl`}>
          <Icon />
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your home tution platform</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            icon={FiUsers}
            color="bg-blue-600"
          />
          <StatCard
            title="New Leads (30d)"
            value={stats.newLeads}
            icon={FiTrendingUp}
            color="bg-green-600"
          />
          <StatCard
            title="Conversions"
            value={stats.convertedLeads}
            icon={FiCheck}
            color="bg-purple-600"
          />
          <StatCard
            title="Pending Verification"
            value={stats.pendingVerification}
            icon={FiAlertCircle}
            color="bg-orange-600"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Active Tutors"
            value={stats.activeTutors}
            icon={FiUsers}
            color="bg-indigo-600"
          />
          <StatCard
            title="Total Tutors"
            value={stats.totalTutors}
            icon={FiUsers}
            color="bg-pink-600"
          />
          <StatCard
            title="Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={FiTrendingUp}
            color="bg-emerald-600"
          />
          <StatCard
            title="Pending Payments"
            value={`₹${stats.pendingPayments.toLocaleString()}`}
            icon={FiAlertCircle}
            color="bg-red-600"
          />
        </div>

        {/* Main Sections */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lead Pipeline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white rounded-lg p-6 card-shadow"
          >
            <h2 className="text-2xl font-bold mb-6">Lead Pipeline</h2>
            <div className="space-y-4">
              {['New', 'Qualified', 'Matching', 'Offered', 'Converted'].map((stage, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">{stage}</span>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${Math.random() * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg p-6 card-shadow"
          >
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/admin/tutors" className="block btn-primary text-center">Verify Tutors</a>
              <a href="/admin/leads" className="block btn-secondary text-center">Manage Leads</a>
              <a href="/admin/config" className="block btn-outline text-center">Configuration</a>
              <a href="/admin/reports" className="block btn-secondary text-center">Reports</a>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white rounded-lg p-6 card-shadow"
        >
          <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <div className="flex-1">
                  <p className="font-medium">Sample Activity {i}</p>
                  <p className="text-sm text-gray-600">Timestamp</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
