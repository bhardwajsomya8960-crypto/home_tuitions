'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiBook, FiUser, FiDollarSign, FiAlertCircle, FiCalendar, FiMessageSquare, FiStar, FiTrendingUp, FiBarChart2 } from 'react-icons/fi'
import Link from 'next/link'
import AppShell from '../../../components/shell/AppShell'
import DataTable, { optionsFrom } from '../../../components/data/DataTable'
import RecordCard from '../../../components/data/RecordCard'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: FiBarChart2 },
  { id: 'students', label: 'Students', icon: FiBook },
  { id: 'tutors', label: 'Tutors', icon: FiUser },
  { id: 'schedule', label: 'Schedule', icon: FiCalendar },
  { id: 'invoices', label: 'Invoices', icon: FiDollarSign },
  { id: 'requests', label: 'Requests', icon: FiMessageSquare },
]

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

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
    <AppShell
      portalLabel="Parent"
      user={{ name: parentData.name, subtitle: 'Parent' }}
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div>
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

        {/* Tab Content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
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
          {/* Students Tab */}
          {activeTab === 'students' && (
            <DataTable
              title="All Students"
              noun="students"
              rows={students}
              rowKey={s => s.id}
              searchPlaceholder="Search student, subject or tutor"
              searchText={s => `${s.name} ${s.subject} ${s.tutor}`}
              filters={[{ key: 'subject', label: 'Subject', get: s => s.subject, options: optionsFrom(students, s => s.subject) }]}
              columns={[
                { key: 'name', header: 'Student', sortable: true, render: s => (
                  <div>
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-600">Class {s.class} • {s.board}</p>
                  </div>
                ) },
                { key: 'tutor', header: 'Tutor', sortable: true, render: s => s.tutor },
                { key: 'subject', header: 'Subject', sortable: true, render: s => s.subject },
                { key: 'mode', header: 'Mode', render: s => s.mode },
                { key: 'progress', header: 'Progress', sortable: true, render: s => (
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
                      <div className="h-full bg-green-500" style={{ width: `${s.progress}%` }} />
                    </div>
                    <span className="text-xs font-semibold w-10 text-right">{s.progress}%</span>
                  </div>
                ) },
                { key: 'tutorRating', header: 'Tutor Rating', sortable: true, align: 'right', render: s => (
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <FiStar className="w-4 h-4 text-yellow-500 fill-current" aria-hidden="true" />
                    {s.tutorRating}
                  </span>
                ) },
              ]}
              renderCard={s => (
                <RecordCard
                  title={s.name}
                  subtitle={`Class ${s.class} • ${s.board}`}
                  fields={[['Tutor', s.tutor], ['Subject', s.subject], ['Mode', s.mode], ['Progress', `${s.progress}%`]]}
                />
              )}
              emptyMessage="No students yet."
            />
          )}
          {/* Tutors Tab */}
          {/* Tutors Tab */}
          {activeTab === 'tutors' && (
            <DataTable
              title="Your Tutors"
              noun="tutors"
              rows={tutors}
              rowKey={t => t.id}
              searchPlaceholder="Search name, subject or email"
              searchText={t => `${t.name} ${t.subject} ${t.email}`}
              columns={[
                { key: 'name', header: 'Tutor', sortable: true, render: t => (
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-600">{t.subject} • {t.experience}</p>
                  </div>
                ) },
                { key: 'rating', header: 'Rating', sortable: true, render: t => (
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <FiStar className="w-4 h-4 text-yellow-500 fill-current" aria-hidden="true" />
                    {t.rating}
                  </span>
                ) },
                { key: 'classes', header: 'Classes Completed', sortable: true, render: t => t.classes },
                { key: 'phone', header: 'Phone', render: t => t.phone },
                { key: 'email', header: 'Email', render: t => <span className="text-gray-600">{t.email}</span> },
              ]}
              renderCard={t => (
                <RecordCard
                  title={t.name}
                  subtitle={`${t.subject} • ${t.experience}`}
                  badge={<span className="inline-flex items-center gap-1 text-sm font-semibold"><FiStar className="w-4 h-4 text-yellow-500 fill-current" aria-hidden="true" />{t.rating}</span>}
                  fields={[['Classes completed', t.classes], ['Phone', t.phone], ['Email', t.email]]}
                />
              )}
              emptyMessage="No tutors assigned yet."
            />
          )}
          {/* Schedule Tab */}
          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <DataTable
              title="Class Schedule"
              noun="classes"
              rows={schedule}
              rowKey={i => i.id}
              searchPlaceholder="Search student, tutor or subject"
              searchText={i => `${i.student} ${i.tutor} ${i.subject}`}
              filters={[{ key: 'mode', label: 'Mode', get: i => i.mode, options: optionsFrom(schedule, i => i.mode) }]}
              columns={[
                { key: 'student', header: 'Student', sortable: true, render: i => <span className="font-semibold text-gray-900">{i.student}</span> },
                { key: 'tutor', header: 'Tutor', sortable: true, render: i => i.tutor },
                { key: 'subject', header: 'Subject', sortable: true, render: i => i.subject },
                { key: 'date', header: 'Date', sortable: true, render: i => <span className="font-medium">{i.date}</span> },
                { key: 'time', header: 'Time', render: i => <span className="text-gray-600">{i.time}</span> },
                { key: 'mode', header: 'Mode', render: i => (
                  <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs whitespace-nowrap">{i.mode}</span>
                ) },
              ]}
              renderCard={i => (
                <RecordCard
                  title={i.student}
                  subtitle={`${i.tutor} • ${i.subject}`}
                  badge={<span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs">{i.mode}</span>}
                  fields={[['Date', i.date], ['Time', i.time]]}
                />
              )}
              emptyMessage="No classes scheduled."
            />
          )}
          {/* Invoices Tab */}
          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <DataTable
              title="Payment History & Invoices"
              noun="invoices"
              rows={invoices}
              rowKey={inv => inv.id}
              searchPlaceholder="Search student or period"
              searchText={inv => `${inv.studentName} ${inv.month}`}
              filters={[{ key: 'status', label: 'Status', get: inv => inv.status, options: optionsFrom(invoices, inv => inv.status) }]}
              columns={[
                { key: 'studentName', header: 'Student', sortable: true, render: inv => <span className="font-medium">{inv.studentName}</span> },
                { key: 'month', header: 'Period', render: inv => inv.month },
                { key: 'amount', header: 'Amount', sortable: true, render: inv => <span className="font-bold">₹{inv.amount}</span> },
                { key: 'status', header: 'Status', sortable: true, render: inv => (
                  <span className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {inv.status}
                  </span>
                ) },
                { key: 'action', header: 'Action', align: 'right', render: inv => (
                  inv.status === 'pending'
                    ? <button onClick={() => handlePayment(inv.id)} className="text-blue-600 font-semibold hover:underline">Pay</button>
                    : <button className="text-gray-600 font-semibold hover:underline">View</button>
                ) },
              ]}
              renderCard={inv => (
                <RecordCard
                  title={inv.studentName}
                  subtitle={inv.month}
                  badge={<span className={`px-2.5 py-1 rounded-full text-xs ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{inv.status}</span>}
                  fields={[['Amount', `₹${inv.amount}`]]}
                  actions={inv.status === 'pending'
                    ? <button onClick={() => handlePayment(inv.id)} className="btn-primary text-sm py-2 px-4">Pay</button>
                    : <button className="btn-secondary text-sm py-2 px-4">View</button>}
                />
              )}
              emptyMessage="No invoices yet."
            />
          )}
          {/* Requests Tab */}
          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <DataTable
              title="Requests & Approvals"
              noun="requests"
              rows={requests}
              rowKey={r => r.id}
              searchPlaceholder="Search type, student or reason"
              searchText={r => `${r.type} ${r.student} ${r.reason || ''} ${r.topic || ''}`}
              filters={[{ key: 'status', label: 'Status', get: r => r.status, options: optionsFrom(requests, r => r.status) }]}
              columns={[
                { key: 'type', header: 'Request', sortable: true, render: r => <span className="font-semibold text-gray-900">{r.type}</span> },
                { key: 'student', header: 'Student', sortable: true, render: r => r.student },
                { key: 'details', header: 'Details', render: r => (
                  <span className="text-gray-600">{r.reason ? `Reason: ${r.reason}` : r.topic ? `Topic: ${r.topic}` : '–'}</span>
                ) },
                { key: 'status', header: 'Status', sortable: true, render: r => (
                  <span className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${
                    r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {r.status}
                  </span>
                ) },
              ]}
              renderCard={r => (
                <RecordCard
                  title={r.type}
                  subtitle={r.student}
                  badge={<span className={`px-2.5 py-1 rounded-full text-xs ${r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{r.status}</span>}
                  fields={[[r.reason ? 'Reason' : 'Topic', r.reason || r.topic || '–']]}
                />
              )}
              emptyMessage="No requests yet."
            />
          )}
        </motion.div>
      </div>
    </AppShell>
  )
}
