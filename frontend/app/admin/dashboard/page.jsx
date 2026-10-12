'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { FiUsers, FiTrendingUp, FiCheck, FiAlertCircle, FiMenu, FiLogOut, FiBarChart2, FiSettings, FiDollarSign } from 'react-icons/fi'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [stats, setStats] = useState({
    totalLeads: 156,
    newLeads: 24,
    convertedLeads: 89,
    totalTutors: 42,
    activeTutors: 38,
    pendingVerification: 4,
    totalRevenue: 285000,
    pendingPayments: 45000,
  })

  const [leads, setLeads] = useState([
    { id: 1, parent: 'Raj Kumar', student: 'Aarav Singh', class: 8, subject: 'Maths', status: 'converted', tutorAssigned: 'Rahul Kumar', createdAt: '2024-10-01' },
    { id: 2, parent: 'Priya Patel', student: 'Nisha Patel', class: 10, subject: 'Science', status: 'matching', tutorAssigned: 'Pending', createdAt: '2024-10-05' },
    { id: 3, parent: 'Amit Singh', student: 'Rohan Singh', class: 9, subject: 'English', status: 'demo_scheduled', tutorAssigned: 'Priya Sharma', createdAt: '2024-10-08' },
    { id: 4, parent: 'Kavya Nair', student: 'Divya Nair', class: 7, subject: 'Maths', status: 'qualified', tutorAssigned: 'Pending', createdAt: '2024-10-10' },
  ])

  const [tutors, setTutors] = useState([
    { id: 1, name: 'Rahul Kumar', email: 'rahul@example.com', subjects: 'Maths, Science', classes: [7, 8, 9, 10], status: 'verified', rating: 4.8, activeStudents: 5 },
    { id: 2, name: 'Priya Sharma', email: 'priya@example.com', subjects: 'Science, English', classes: [8, 9, 10, 11], status: 'verified', rating: 4.6, activeStudents: 4 },
    { id: 3, name: 'Arjun Verma', email: 'arjun@example.com', subjects: 'Maths', classes: [6, 7, 8], status: 'pending_verification', rating: 0, activeStudents: 0 },
    { id: 4, name: 'Neha Gupta', email: 'neha@example.com', subjects: 'History, Geography', classes: [9, 10, 11], status: 'verified', rating: 4.7, activeStudents: 3 },
  ])

  const [config, setConfig] = useState({
    distanceWeight: 30,
    subjectFitWeight: 25,
    availabilityWeight: 15,
    experienceWeight: 10,
    qualityWeight: 10,
    acceptanceReliabilityWeight: 5,
    feeFitWeight: 5,
    homeRadius: 8,
    maxRadius: 12,
    offerTimeout: 10,
  })

  const [showConfigEdit, setShowConfigEdit] = useState(false)

  const getStatusColor = (status) => {
    const colors = {
      converted: 'bg-green-100 text-green-800',
      matching: 'bg-blue-100 text-blue-800',
      demo_scheduled: 'bg-purple-100 text-purple-800',
      qualified: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      pending_verification: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const handleVerifyTutor = (tutorId) => {
    setTutors(tutors.map(t =>
      t.id === tutorId ? { ...t, status: 'verified' } : t
    ))
    alert('Tutor verified successfully!')
  }

  const handleUpdateConfig = (e) => {
    e.preventDefault()
    setShowConfigEdit(false)
    alert('Configuration updated successfully!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
              <FiMenu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold gradient-text">home tution</h1>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold ml-4">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-semibold">Admin Panel</p>
              <p className="text-sm text-gray-600">System Administrator</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <FiLogOut className="w-6 h-6 text-red-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-lg p-6 card-shadow hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Total Leads</p>
                <p className="text-3xl font-bold mt-2">{stats.totalLeads}</p>
                <p className="text-xs text-green-600 mt-1">+{stats.newLeads} new this month</p>
              </div>
              <FiUsers className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 card-shadow hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Conversions</p>
                <p className="text-3xl font-bold mt-2">{stats.convertedLeads}</p>
                <p className="text-xs text-blue-600 mt-1">{((stats.convertedLeads/stats.totalLeads)*100).toFixed(1)}% rate</p>
              </div>
              <FiCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 card-shadow hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Tutors</p>
                <p className="text-3xl font-bold mt-2">{stats.totalTutors}</p>
                <p className="text-xs text-orange-600 mt-1">{stats.pendingVerification} pending</p>
              </div>
              <FiUsers className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 card-shadow hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Revenue</p>
                <p className="text-3xl font-bold mt-2">₹{(stats.totalRevenue/1000).toFixed(0)}k</p>
                <p className="text-xs text-red-600 mt-1">₹{(stats.pendingPayments/1000).toFixed(0)}k pending</p>
              </div>
              <FiDollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 border-b bg-white rounded-t-lg px-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: FiBarChart2 },
              { id: 'leads', label: 'Leads', icon: FiUsers },
              { id: 'tutors', label: 'Tutors', icon: FiUsers },
              { id: 'finance', label: 'Finance', icon: FiDollarSign },
              { id: 'config', label: 'Configuration', icon: FiSettings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-b-lg p-6 card-shadow">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-6">Lead Pipeline</h3>
                <div className="space-y-4">
                  {[
                    { stage: 'New', count: 24, color: 'from-blue-100 to-blue-50' },
                    { stage: 'Qualified', count: 18, color: 'from-yellow-100 to-yellow-50' },
                    { stage: 'Matching', count: 22, color: 'from-purple-100 to-purple-50' },
                    { stage: 'Demo Scheduled', count: 15, color: 'from-orange-100 to-orange-50' },
                    { stage: 'Converted', count: 89, color: 'from-green-100 to-green-50' },
                  ].map((pipeline, i) => (
                    <div key={i} className={`p-4 rounded-lg bg-gradient-to-r ${pipeline.color}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">{pipeline.stage}</span>
                        <span className="text-xl font-bold">{pipeline.count}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${(pipeline.count / stats.totalLeads) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-6">Key Metrics</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <p className="text-gray-600 text-sm mb-2">Avg. Lead to Demo Time</p>
                    <p className="text-3xl font-bold">4.2 days</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-gray-600 text-sm mb-2">Avg. Demo to Conversion</p>
                    <p className="text-3xl font-bold">2.8 days</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-gray-600 text-sm mb-2">Tutor Acceptance Rate</p>
                    <p className="text-3xl font-bold">87%</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-gray-600 text-sm mb-2">Avg. Revenue Per Conversion</p>
                    <p className="text-3xl font-bold">₹3,200</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div>
              <h3 className="text-xl font-bold mb-6">All Leads</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="py-3 px-4">Parent / Student</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Tutor Assigned</th>
                      <th className="py-3 px-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-semibold">{lead.parent}</p>
                          <p className="text-xs text-gray-600">{lead.student}</p>
                        </td>
                        <td className="py-4 px-4">{lead.class}</td>
                        <td className="py-4 px-4 font-medium">{lead.subject}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>
                            {lead.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4">{lead.tutorAssigned}</td>
                        <td className="py-4 px-4 text-xs text-gray-600">{lead.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tutors Tab */}
          {activeTab === 'tutors' && (
            <div>
              <h3 className="text-xl font-bold mb-6">Tutor Management</h3>
              <div className="space-y-4">
                {tutors.map(tutor => (
                  <div key={tutor.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="grid md:grid-cols-6 gap-4 items-center">
                      <div>
                        <p className="font-bold">{tutor.name}</p>
                        <p className="text-sm text-gray-600">{tutor.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Subjects</p>
                        <p className="font-semibold text-sm">{tutor.subjects}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Classes</p>
                        <p className="font-semibold text-sm">{tutor.classes.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Rating</p>
                        <p className="font-bold">{tutor.rating > 0 ? tutor.rating : '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Students</p>
                        <p className="font-bold">{tutor.activeStudents}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(tutor.status)}`}>
                          {tutor.status.replace(/_/g, ' ')}
                        </span>
                        {tutor.status === 'pending_verification' && (
                          <button onClick={() => handleVerifyTutor(tutor.id)} className="btn-primary text-xs py-1 px-3">
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Finance Tab */}
          {activeTab === 'finance' && (
            <div>
              <h3 className="text-xl font-bold mb-6">Finance Dashboard</h3>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 border rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Total Revenue</p>
                  <p className="text-3xl font-bold">₹{stats.totalRevenue}</p>
                  <p className="text-xs text-green-600 mt-1">+15% from last month</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Pending Collections</p>
                  <p className="text-3xl font-bold">₹{stats.pendingPayments}</p>
                  <p className="text-xs text-orange-600 mt-1">{((stats.pendingPayments/stats.totalRevenue)*100).toFixed(1)}% of revenue</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Tutor Payouts (This Month)</p>
                  <p className="text-3xl font-bold">₹156,500</p>
                  <p className="text-xs text-blue-600 mt-1">8 tutors paid</p>
                </div>
              </div>
              <h4 className="font-bold mb-4">Payment Status</h4>
              <div className="space-y-3">
                {[
                  { name: 'Collections', percentage: 68, color: 'bg-green-600' },
                  { name: 'Pending', percentage: 32, color: 'bg-orange-600' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold">{item.name}</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Matching Algorithm Configuration</h3>
                <button onClick={() => setShowConfigEdit(!showConfigEdit)} className="btn-primary">
                  {showConfigEdit ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {!showConfigEdit ? (
                <div>
                  <h4 className="font-bold mb-4">Scoring Weights</h4>
                  <div className="space-y-3 mb-8">
                    {[
                      { label: 'Distance', key: 'distanceWeight' },
                      { label: 'Subject Fit', key: 'subjectFitWeight' },
                      { label: 'Availability', key: 'availabilityWeight' },
                      { label: 'Experience', key: 'experienceWeight' },
                      { label: 'Quality/Rating', key: 'qualityWeight' },
                      { label: 'Acceptance Reliability', key: 'acceptanceReliabilityWeight' },
                      { label: 'Fee Fit', key: 'feeFitWeight' },
                    ].map(item => (
                      <div key={item.key}>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold">{item.label}</span>
                          <span>{config[item.key]}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${config[item.key]}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-bold mb-4">Distance Settings</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Default Home Radius</p>
                      <p className="text-2xl font-bold">{config.homeRadius} km</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Maximum Extended Radius</p>
                      <p className="text-2xl font-bold">{config.maxRadius} km</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Lead Offer Timeout</p>
                      <p className="text-2xl font-bold">{config.offerTimeout} minutes</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateConfig} className="space-y-6">
                  <h4 className="font-bold">Update Weights</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { label: 'Distance', key: 'distanceWeight' },
                      { label: 'Subject Fit', key: 'subjectFitWeight' },
                      { label: 'Availability', key: 'availabilityWeight' },
                      { label: 'Experience', key: 'experienceWeight' },
                      { label: 'Quality/Rating', key: 'qualityWeight' },
                      { label: 'Acceptance Reliability', key: 'acceptanceReliabilityWeight' },
                      { label: 'Fee Fit', key: 'feeFitWeight' },
                    ].map(item => (
                      <div key={item.key}>
                        <label className="block text-sm font-medium mb-2">{item.label} (%)</label>
                        <input
                          type="number"
                          value={config[item.key]}
                          onChange={(e) => setConfig({...config, [item.key]: parseInt(e.target.value)})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          min="0"
                          max="100"
                        />
                      </div>
                    ))}
                  </div>

                  <h4 className="font-bold mt-6">Update Distance Settings</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Home Radius (km)</label>
                      <input
                        type="number"
                        value={config.homeRadius}
                        onChange={(e) => setConfig({...config, homeRadius: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Radius (km)</label>
                      <input
                        type="number"
                        value={config.maxRadius}
                        onChange={(e) => setConfig({...config, maxRadius: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Offer Timeout (mins)</label>
                      <input
                        type="number"
                        value={config.offerTimeout}
                        onChange={(e) => setConfig({...config, offerTimeout: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button type="submit" className="flex-1 btn-primary">Save Configuration</button>
                    <button type="button" onClick={() => setShowConfigEdit(false)} className="flex-1 btn-secondary">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
