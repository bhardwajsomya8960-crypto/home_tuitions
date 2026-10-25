// Builders for new parent and student documents, shared by the parent and lead services.
function parentRecord(ctx, v, location, consent) {
  const stamp = ctx.iso()
  return {
    id: ctx.newId(), name: v.name, phone: v.phone, email: v.email || null, relationship: v.relationship,
    address: location.address, pincode: location.pincode, latitude: location.latitude, longitude: location.longitude,
    consent, status: 'active', createdAt: stamp, updatedAt: stamp,
  }
}

function studentRecord(ctx, parentId, s) {
  const stamp = ctx.iso()
  return {
    id: ctx.newId(), parentId, name: s.studentName, class: s.studentClass, board: s.board,
    school: s.school || null, subjects: s.subjects || [], createdAt: stamp, updatedAt: stamp,
  }
}

module.exports = { parentRecord, studentRecord }
