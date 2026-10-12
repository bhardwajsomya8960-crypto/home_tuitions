'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiMenu, FiLogOut, FiStar, FiClock, FiDollarSign, FiUsers, FiCheckCircle, FiAlertCircle, FiCalendar, FiMessageSquare } from 'react-icons/fi'
import Link from 'next/link'

export default function TutorDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tutorData, setTutorData] = useState({
    name: 'Rahul Kumar',
    rating: 4.8,
    email: 'rahul@example.com',
    phone: '9876543210',
    subjects: ['Maths', 'Science'],
    classes: [7, 8, 9, 10],
    verificationStatus: 'verified',
    studentsCount: 5,
    earnedThisMonth: 12500,
    totalEarned: 45000,
    activeStudents: 5,
    pendingLeads: 2,
    completedClasses: 87,
    averageRating: 4.8,
  })

  const [leads, setLeads] = useState([
    { id: 1, studentName: 'Aarav Singh', class: '8', subject: 'Maths', distance: '2.5 km', budget: '₹500/month', status: 'pending', expiresIn: '5 mins' },
    { id: 2, studentName: 'Priya Sharma', class: '9', subject: 'Science', distance: '3.2 km', budget: '₹600/month', status: 'pending', expiresIn: '8 mins' },
  ])

  const [students, setStudents] = useState([
    { id: 1, name: 'Aarav Singh', class: '8', subject: 'Maths', joinDate: '2024-09-15', status: 'active', attendance: '95%', rating: 4.9 },
    { id: 2, name: 'Nisha Patel', class: '10', subject: 'Science', joinDate: '2024-08-20', status: 'active', attendance: '88%', rating: 4.7 },
    { id: 3, name: 'Rohan Gupta', class: '7', subject: 'English', joinDate: '2024-07-10', status: 'active', attendance: '92%', rating: 4.8 },
  ])

  const [schedule, setSchedule] = useState([
    { id: 1, student: 'Aarav Singh', date: '2024-10-13', time: '4:00 PM - 5:00 PM', subject: 'Maths', status: 'scheduled' },
    { id: 2, student: 'Nisha Patel', date: '2024-10-13', time: '5:30 PM - 6:30 PM', subject: 'Science', status: 'scheduled' },
    { id: 3, student: 'Rohan Gupta', date: '2024-10-14', time: '3:00 PM - 4:00 PM', subject: 'English', status: 'scheduled' },
  ])

  const [earnings, setEarnings] = useState([
    { id: 1, student: 'Aarav Singh', month: 'September 2024', amount: 2500, status: 'paid' },
    { id: 2, student: 'Nisha Patel', month: 'September 2024', amount: 3000, status: 'paid' },
    { id: 3, student: 'Rohan Gupta', month: 'September 2024', amount: 2000, status: 'pending' },
    { id: 4, student: 'Aarav Singh', month: 'October 2024', amount: 2500, status: 'pending' },
  ])

  const handleAcceptLead = (id) => {
    setLeads(leads.filter(l => l.id !== id))
    alert('Lead accepted! Demo will be scheduled.')
  }

  const handleRejectLead = (id) => {
    setLeads(leads.filter(l => l.id !== id))
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
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-semibold">{tutorData.name}</p>
              <p className="text-sm text-gray-600">{tutorData.verificationStatus}</p>
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
          <div className="bg-white rounded-lg p-6 card-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Rating</p>
                <p className="text-3xl font-bold mt-2">{tutorData.averageRating}</p>
              </div>
              <FiStar className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 card-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Active Students</p>
                <p className="text-3xl font-bold mt-2">{tutorData.activeStudents}</p>
              </div>
              <FiUsers className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 card-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">This Month</p>
                <p className="text-3xl font-bold mt-2">₹{tutorData.earnedThisMonth}</p>
              </div>
              <FiDollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 card-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Classes</p>
                <p className="text-3xl font-bold mt-2">{tutorData.completedClasses}</p>
              </div>
              <FiCalendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-4 border-b bg-white rounded-t-lg px-6">
            {['overview', 'leads', 'students', 'schedule', 'earnings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-4 font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-b-lg p-6 card-shadow">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Pending Leads */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiAlertCircle className="text-orange-500" />
                  Pending Lead Offers
                </h3>
                {leads.length > 0 ? (
                  <div className="space-y-4">
                    {leads.map(lead => (
                      <motion.div key={lead.id} className="border rounded-lg p-4 hover:shadow-md transition-all" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold">{lead.studentName}</h4>
                            <p className="text-sm text-gray-600">Class {lead.class} • {lead.subject}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-semibold text-orange-600">{lead.expiresIn} left</p>
                            <p className="text-gray-600">{lead.distance}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{lead.budget}</p>
                        <div className="flex gap-3">
                          <button onClick={() => handleAcceptLead(lead.id)} className="flex-1 btn-primary py-2">Accept</button>
                          <button onClick={() => handleRejectLead(lead.id)} className="flex-1 btn-secondary py-2">Reject</button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 py-8 text-center">No pending leads</p>
                )}
              </div>

              {/* Recent Students */}
              <div>
                <h3 className="text-xl font-bold mb-4">Active Students</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Class</th>
                        <th className="py-3 px-4">Attendance</th>
                        <th className="py-3 px-4">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 3).map(student => (
                        <tr key={student.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4 font-medium">{student.name}</td>
                          <td className="py-4 px-4">{student.class}</td>
                          <td className="py-4 px-4">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">{student.attendance}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
                              {student.rating}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div>
              <h3 className="text-xl font-bold mb-6">Lead Offers</h3>
              {leads.length > 0 ? (
                <div className="space-y-4">
                  {leads.map(lead => (
                    <div key={lead.id} className="border rounded-lg p-4">
                      <div className="grid md:grid-cols-5 gap-4 items-center">
                        <div>
                          <p className="font-bold">{lead.studentName}</p>
                          <p className="text-sm text-gray-600">Class {lead.class}</p>
                        </div>
                        <p className="text-sm">{lead.subject}</p>
                        <p className="text-sm text-gray-600">{lead.distance}</p>
                        <p className="text-sm font-semibold">{lead.budget}</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleAcceptLead(lead.id)} className="btn-primary py-2 px-4 text-sm">Accept</button>
                          <button onClick={() => handleRejectLead(lead.id)} className="btn-secondary py-2 px-4 text-sm">Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">No leads available</p>
              )}
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              <h3 className="text-xl font-bold mb-6">My Students</h3>
              <div className="space-y-4">
                {students.map(student => (
                  <div key={student.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="grid md:grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="font-bold">{student.name}</p>
                        <p className="text-sm text-gray-600">Class {student.class}</p>
                      </div>
                      <p className="text-sm">{student.subject}</p>
                      <p className="text-sm text-gray-600">Joined {student.joinDate}</p>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs w-fit">{student.status}</span>
                      <div className="flex items-center gap-2 justify-end">
                        <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-semibold">{student.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div>
              <h3 className="text-xl font-bold mb-6">Class Schedule</h3>
              <div className="space-y-4">
                {schedule.map(item => (
                  <div key={item.id} className="border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-all">
                    <div>
                      <p className="font-bold">{item.student}</p>
                      <p className="text-sm text-gray-600">{item.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{item.date}</p>
                      <p className="text-sm text-gray-600">{item.time}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div>
              <h3 className="text-xl font-bold mb-6">Earnings</h3>
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600">₹{tutorData.totalEarned}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map(item => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium">{item.student}</td>
                        <td className="py-4 px-4">{item.month}</td>
                        <td className="py-4 px-4 font-bold">₹{item.amount}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            item.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
