'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiStar, FiDollarSign, FiUsers, FiAlertCircle, FiCalendar, FiBarChart2, FiBook } from 'react-icons/fi'
import Link from 'next/link'
import AppShell from '../../../components/shell/AppShell'
import DataTable, { optionsFrom } from '../../../components/data/DataTable'
import RecordCard from '../../../components/data/RecordCard'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: FiBarChart2 },
  { id: 'leads', label: 'Leads', icon: FiUsers },
  { id: 'students', label: 'Students', icon: FiBook },
  { id: 'schedule', label: 'Schedule', icon: FiCalendar },
  { id: 'earnings', label: 'Earnings', icon: FiDollarSign },
]

export default function TutorDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
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
    <AppShell
      portalLabel="Tutor"
      user={{ name: tutorData.name, subtitle: tutorData.verificationStatus }}
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

        {/* Tab Content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
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
          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <DataTable
              title="Lead Offers"
              noun="offers"
              rows={leads}
              rowKey={l => l.id}
              searchPlaceholder="Search student or subject"
              searchText={l => `${l.studentName} ${l.subject}`}
              columns={[
                { key: 'studentName', header: 'Student', sortable: true, render: l => (
                  <div>
                    <p className="font-semibold text-gray-900">{l.studentName}</p>
                    <p className="text-xs text-gray-600">Class {l.class}</p>
                  </div>
                ) },
                { key: 'subject', header: 'Subject', sortable: true, render: l => l.subject },
                { key: 'distance', header: 'Distance', render: l => <span className="text-gray-600">{l.distance}</span> },
                { key: 'budget', header: 'Budget', render: l => <span className="font-semibold">{l.budget}</span> },
                { key: 'actions', header: 'Actions', align: 'right', render: l => (
                  <div className="inline-flex gap-2">
                    <button onClick={() => handleAcceptLead(l.id)} className="btn-primary py-1.5 px-3 text-sm">Accept</button>
                    <button onClick={() => handleRejectLead(l.id)} className="btn-secondary py-1.5 px-3 text-sm">Reject</button>
                  </div>
                ) },
              ]}
              renderCard={l => (
                <RecordCard
                  title={l.studentName}
                  subtitle={`Class ${l.class}`}
                  fields={[['Subject', l.subject], ['Distance', l.distance], ['Budget', l.budget]]}
                  actions={(
                    <>
                      <button onClick={() => handleAcceptLead(l.id)} className="btn-primary py-2 px-4 text-sm">Accept</button>
                      <button onClick={() => handleRejectLead(l.id)} className="btn-secondary py-2 px-4 text-sm">Reject</button>
                    </>
                  )}
                />
              )}
              emptyMessage="No lead offers right now."
            />
          )}
          {/* Students Tab */}
          {/* Students Tab */}
          {activeTab === 'students' && (
            <DataTable
              title="My Students"
              noun="students"
              rows={students}
              rowKey={s => s.id}
              searchPlaceholder="Search student or subject"
              searchText={s => `${s.name} ${s.subject}`}
              filters={[{ key: 'status', label: 'Status', get: s => s.status, options: optionsFrom(students, s => s.status) }]}
              columns={[
                { key: 'name', header: 'Student', sortable: true, render: s => (
                  <div>
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-600">Class {s.class}</p>
                  </div>
                ) },
                { key: 'subject', header: 'Subject', sortable: true, render: s => s.subject },
                { key: 'joinDate', header: 'Joined', sortable: true, render: s => <span className="text-gray-600">{s.joinDate}</span> },
                { key: 'status', header: 'Status', sortable: true, render: s => (
                  <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs whitespace-nowrap">{s.status}</span>
                ) },
                { key: 'rating', header: 'Rating', sortable: true, align: 'right', render: s => (
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <FiStar className="w-4 h-4 text-yellow-500 fill-current" aria-hidden="true" />
                    {s.rating}
                  </span>
                ) },
              ]}
              renderCard={s => (
                <RecordCard
                  title={s.name}
                  subtitle={`Class ${s.class}`}
                  badge={<span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs">{s.status}</span>}
                  fields={[['Subject', s.subject], ['Joined', s.joinDate], ['Rating', s.rating]]}
                />
              )}
              emptyMessage="No students yet."
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
              searchPlaceholder="Search student or subject"
              searchText={i => `${i.student} ${i.subject}`}
              columns={[
                { key: 'student', header: 'Student', sortable: true, render: i => <span className="font-semibold text-gray-900">{i.student}</span> },
                { key: 'subject', header: 'Subject', sortable: true, render: i => i.subject },
                { key: 'date', header: 'Date', sortable: true, render: i => <span className="font-medium">{i.date}</span> },
                { key: 'time', header: 'Time', render: i => <span className="text-gray-600">{i.time}</span> },
                { key: 'status', header: 'Status', sortable: true, render: i => (
                  <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs whitespace-nowrap">{i.status}</span>
                ) },
              ]}
              renderCard={i => (
                <RecordCard
                  title={i.student}
                  subtitle={i.subject}
                  badge={<span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs">{i.status}</span>}
                  fields={[['Date', i.date], ['Time', i.time]]}
                />
              )}
              emptyMessage="No classes scheduled."
            />
          )}
          {/* Earnings Tab */}
          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600">₹{tutorData.totalEarned}</p>
              </div>
              <DataTable
                title="Payouts"
                noun="entries"
                rows={earnings}
                rowKey={e => e.id}
                searchPlaceholder="Search student or period"
                searchText={e => `${e.student} ${e.month}`}
                filters={[{ key: 'status', label: 'Status', get: e => e.status, options: optionsFrom(earnings, e => e.status) }]}
                columns={[
                  { key: 'student', header: 'Student', sortable: true, render: e => <span className="font-medium">{e.student}</span> },
                  { key: 'month', header: 'Period', render: e => e.month },
                  { key: 'amount', header: 'Amount', sortable: true, render: e => <span className="font-bold">₹{e.amount}</span> },
                  { key: 'status', header: 'Status', sortable: true, render: e => (
                    <span className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${
                      e.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {e.status}
                    </span>
                  ) },
                ]}
                renderCard={e => (
                  <RecordCard
                    title={e.student}
                    subtitle={e.month}
                    badge={<span className={`px-2.5 py-1 rounded-full text-xs ${e.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{e.status}</span>}
                    fields={[['Amount', `₹${e.amount}`]]}
                  />
                )}
                emptyMessage="No earnings recorded yet."
              />
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  )
}
