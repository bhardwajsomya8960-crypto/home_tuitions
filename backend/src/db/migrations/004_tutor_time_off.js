// Holidays and leave: [{ from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', reason }]. Tutors on leave are not offered leads.
module.exports = `
ALTER TABLE tutors ADD COLUMN time_off TEXT NOT NULL DEFAULT '[]';
`
