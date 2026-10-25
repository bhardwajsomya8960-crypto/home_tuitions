// Tutors can add several documents of each type, so each one gets a name and an optional note.
module.exports = `
ALTER TABLE tutor_documents ADD COLUMN title TEXT;
ALTER TABLE tutor_documents ADD COLUMN description TEXT;
`
