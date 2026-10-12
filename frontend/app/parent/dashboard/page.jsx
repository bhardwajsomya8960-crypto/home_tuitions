'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiMenu, FiLogOut, FiBook, FiUser, FiDollarSign, FiCheckCircle, FiAlertCircle, FiCalendar, FiMessageSquare, FiStar, FiTrendingUp } from 'react-icons/fi'
import Link from 'next/link'

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [parentData, setParentData] = useState({
    name: 'Raj Kumar',
    email: 'raj@example.com',
    phone: '9876543210',
    studentsCount: 2,
    activeTutorships: 2,
    totalSpentThisMonth: 11500,
    averageProgress: 87,
  })

  const [students, setStudents] = useState([
    {
      id: 1,
      name: 'Aarav Singh',
      class: '8',
      board: 'CBSE',
      tutor: 'Rahul Kumar',
      subject: 'Maths',
      mode: 'Home',
      startDate: '2024-09-15',
      status: 'active',
      progress: 85,
      tutorRating: 4.8,
      nextClass: '2024-10-13 at 4:00 PM'
    },
    {
      id: 2,
      name: 'Priya Singh',
      class: '10',
      board: 'CBSE',
      tutor: 'Priya Sharma',
      subject: 'Science',
      mode: 'Online',
      startDate: '2024-08-20',
      status: 'active',
      progress: 89,
      tutorRating: 4.6,
      nextClass: '2024-10-14 at 5:30 PM'
    },
  ])

  const [tutors, setTutors] = useState([
    { id: 1, name: 'Rahul Kumar', subject: 'Maths', rating: 4.8, classes: 15, experience: '5 years', phone: '9876543210', email: 'rahul@example.com' },
    { id: 2, name: 'Priya Sharma', subject: 'Science', rating: 4.6, classes: 22, experience: '3 years', phone: '9876543211', email: 'priya@example.com' },
  ])

  const [invoices, setInvoices] = useState([
    { id: 1, studentName: 'Aarav Singh', tutorName: 'Rahul Kumar', month: 'September 2024', amount: 5750, dueDate: '2024-10-05', status: 'paid', paymentDate: '2024-10-01' },
    { id: 2, studentName: 'Priya Singh', tutorName: 'Priya Sharma', month: 'September 2024', amount: 5750, dueDate: '2024-10-05', status: 'paid', paymentDate: '2024-10-02' },
    { id: 3, studentName: 'Aarav Singh', tutorName: 'Rahul Kumar', month: 'October 2024', amount: 5750, dueDate: '2024-11-05', status: 'pending', paymentDate: null },
  ])

  const [schedule, setSchedule] = useState([
    { id: 1, student: 'Aarav Singh', tutor: 'Rahul Kumar', subject: 'Maths', date: '2024-10-13', time: '4:00 PM - 5:00 PM', status: 'scheduled', mode: 'Home' },
    { id: 2, student: 'Priya Singh', tutor: 'Priya Sharma', subject: 'Science', date: '2024-10-14', time: '5:30 PM - 6:30 PM', status: 'scheduled', mode: 'Online' },
    { id: 3, student: 'Aarav Singh', tutor: 'Rahul Kumar', subject: 'Maths', date: '2024-10-15', time: '4:00 PM - 5:00 PM', status: 'scheduled', mode: 'Home' },
  ])

  const [requests, setRequests] = useState([
    { id: 1, type: 'Reschedule', student: 'Aarav Singh', date: '2024-10-13', reason: 'Doctor appointment', status: 'pending' },
    { id: 2, type: 'Doubt Session', student: 'Priya Singh', topic: 'Integration', status: 'approved' },
  ])

  const handlePayment = (invoiceId) => {
    setInvoices(invoices.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 'paid', paymentDate: new Date().toISOString().split('T')[0] } : inv
    ))
    alert('Payment recorded successfully!')
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
              <p className="font-semibold">{parentData.name}</p>
              <p className="text-sm text-gray-600">Parent</p>
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
                <p className="text-gray-600 text-sm">Students</p>
                <p className="text-3xl font-bold mt-2">{parentData.studentsCount}</p>
              </div>
              <FiBook className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 card-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Active Tutorships</p>
                <p className="text-3xl font-bold mt-2">{parentData.activeTutorships}</p>
              </div>
              <FiUser className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 card-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Spent This Month</p>
                <p className="text-3xl font-bold mt-2">₹{parentData.totalSpentThisMonth}</p>
              </div>
              <FiDollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 card-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Avg Progress</p>
                <p className="text-3xl font-bold mt-2">{parentData.averageProgress}%</p>
              </div>
              <FiTrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-4 border-b bg-white rounded-t-lg px-6 overflow-x-auto">
            {['overview', 'students', 'tutors', 'schedule', 'invoices', 'requests'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-4 font-semibold capitalize transition-all whitespace-nowrap ${
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
              {/* Students Summary */}
              <div>
                <h3 className="text-xl font-bold mb-4">Your Students</h3>
                <div className="space-y-4">
                  {students.map(student => (
                    <motion.div key={student.id} className="border rounded-lg p-4 hover:shadow-md transition-all" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg">{student.name}</h4>
                          <p className="text-sm text-gray-600">Class {student.class} • {student.board}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">{student.status}</span>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 mb-3 text-sm">
                        <div>
                          <p className="text-gray-600">Subject</p>
                          <p className="font-semibold">{student.subject}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tutor</p>
                          <p className="font-semibold">{student.tutor}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Mode</p>
                          <p className="font-semibold">{student.mode}</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold">Progress</p>
                          <p className="text-sm text-gray-600">{student.progress}%</p>
                        </div>
                        <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                          <div className="h-full bg-green-600" style={{ width: `${student.progress}%` }} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm">{student.tutorRating}</span>
                        </div>
                        <p className="text-sm text-gray-600">Next: {student.nextClass}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Pending Payments */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiAlertCircle className="text-orange-500" />
                  Pending Payments
                </h3>
                {invoices.filter(inv => inv.status === 'pending').length > 0 ? (
                  <div className="space-y-3">
                    {invoices.filter(inv => inv.status === 'pending').map(invoice => (
                      <div key={invoice.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{invoice.studentName} • {invoice.month}</p>
                          <p className="text-sm text-gray-600">Due: {invoice.dueDate}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-lg">₹{invoice.amount}</p>
                          <button onClick={() => handlePayment(invoice.id)} className="btn-primary py-2 px-6">Pay Now</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 py-4 text-center">No pending payments</p>
                )}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              <h3 className="text-xl font-bold mb-6">All Students</h3>
              <div className="space-y-4">
                {students.map(student => (
                  <div key={student.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Student Name</p>
                        <p className="font-bold text-lg">{student.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Class & Board</p>
                        <p className="font-semibold">Class {student.class} • {student.board}</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Subject</p>
                        <p className="font-semibold">{student.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Mode</p>
                        <p className="font-semibold">{student.mode}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Progress</p>
                        <p className="font-semibold">{student.progress}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Tutor Rating</p>
                        <div className="flex items-center gap-1">
                          <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
                          <p className="font-semibold">{student.tutorRating}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tutors Tab */}
          {activeTab === 'tutors' && (
            <div>
              <h3 className="text-xl font-bold mb-6">Your Tutors</h3>
              <div className="space-y-4">
                {tutors.map(tutor => (
                  <div key={tutor.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="font-bold text-lg">{tutor.name}</p>
                        <p className="text-sm text-gray-600">{tutor.subject} • {tutor.experience}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end mb-2">
                          <FiStar className="w-5 h-5 text-yellow-500 fill-current" />
                          <span className="font-bold">{tutor.rating}</span>
                        </div>
                        <p className="text-sm text-gray-600">{tutor.classes} classes completed</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm"><strong>Phone:</strong> {tutor.phone}</p>
                      <p className="text-sm"><strong>Email:</strong> {tutor.email}</p>
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
              <div className="space-y-3">
                {schedule.map(item => (
                  <div key={item.id} className="border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-all">
                    <div>
                      <p className="font-bold">{item.student}</p>
                      <p className="text-sm text-gray-600">{item.tutor} • {item.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{item.date}</p>
                      <p className="text-sm text-gray-600">{item.time}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">{item.mode}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              <h3 className="text-xl font-bold mb-6">Payment History & Invoices</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(invoice => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium">{invoice.studentName}</td>
                        <td className="py-4 px-4">{invoice.month}</td>
                        <td className="py-4 px-4 font-bold">₹{invoice.amount}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {invoice.status === 'pending' ? (
                            <button onClick={() => handlePayment(invoice.id)} className="text-blue-600 font-semibold hover:underline">Pay</button>
                          ) : (
                            <button className="text-gray-600 font-semibold">View</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              <h3 className="text-xl font-bold mb-6">Requests & Approvals</h3>
              <div className="space-y-4">
                {requests.map(request => (
                  <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{request.type}</p>
                        <p className="text-sm text-gray-600">{request.student}</p>
                        {request.reason && <p className="text-sm text-gray-600 mt-1">Reason: {request.reason}</p>}
                        {request.topic && <p className="text-sm text-gray-600 mt-1">Topic: {request.topic}</p>}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        request.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
