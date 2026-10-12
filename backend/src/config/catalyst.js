const ZCatalyst = require('zcatalyst-sdk');

class CatalystDB {
  constructor() {
    this.catalyst = ZCatalyst.initialize();
    this.datastore = this.catalyst.getDatastoreInstance();
  }

  // Create a parent record
  async createParent(parentData) {
    const table = await this.datastore.getTable('Parent');
    const record = table.getRecord();
    record.set('name', parentData.name);
    record.set('phone', parentData.phone);
    record.set('email', parentData.email);
    record.set('relationship', parentData.relationship);
    record.set('verification_status', 'verified');
    record.set('created_at', new Date());
    await record.save();
    return record;
  }

  // Create a student record
  async createStudent(studentData) {
    const table = await this.datastore.getTable('Student');
    const record = table.getRecord();
    record.set('parent_id', studentData.parent_id);
    record.set('name', studentData.name);
    record.set('class', studentData.class);
    record.set('board', studentData.board);
    record.set('subjects', studentData.subjects);
    record.set('created_at', new Date());
    await record.save();
    return record;
  }

  // Create a tutor record
  async createTutor(tutorData) {
    const table = await this.datastore.getTable('Tutor');
    const record = table.getRecord();
    record.set('name', tutorData.name);
    record.set('phone', tutorData.phone);
    record.set('email', tutorData.email);
    record.set('qualification', tutorData.qualification);
    record.set('experience', tutorData.experience);
    record.set('subjects', tutorData.subjects);
    record.set('classes', tutorData.classes);
    record.set('boards', tutorData.boards);
    record.set('service_radius', tutorData.service_radius || 8);
    record.set('latitude', tutorData.latitude);
    record.set('longitude', tutorData.longitude);
    record.set('verification_status', 'pending');
    record.set('created_at', new Date());
    await record.save();
    return record;
  }

  // Create a lead record
  async createLead(leadData) {
    const table = await this.datastore.getTable('Lead');
    const record = table.getRecord();
    record.set('parent_id', leadData.parent_id);
    record.set('student_id', leadData.student_id);
    record.set('status', 'new');
    record.set('latitude', leadData.latitude);
    record.set('longitude', leadData.longitude);
    record.set('subjects', leadData.subjects);
    record.set('class', leadData.class);
    record.set('board', leadData.board);
    record.set('mode', leadData.mode);
    record.set('preferred_days', leadData.preferred_days);
    record.set('preferred_times', leadData.preferred_times);
    record.set('budget', leadData.budget);
    record.set('special_requirements', leadData.special_requirements);
    record.set('source', leadData.source || 'website');
    record.set('created_at', new Date());
    await record.save();
    return record;
  }

  // Find tutor by ID
  async getTutorById(tutorId) {
    const table = await this.datastore.getTable('Tutor');
    const query = table.query();
    query.where('RECORDID', '==', tutorId);
    const records = await query.fetch();
    return records.length > 0 ? records[0] : null;
  }

  // Find leads within distance
  async findLeadsNearby(latitude, longitude, radiusKm) {
    const table = await this.datastore.getTable('Lead');
    const allLeads = await table.getRecords();

    // Filter leads within radius using Haversine formula
    const nearbyLeads = allLeads.filter(lead => {
      const distance = this.haversineDistance(
        latitude, longitude,
        lead.latitude, lead.longitude
      );
      return distance <= radiusKm;
    });

    return nearbyLeads;
  }

  // Haversine distance formula (km)
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Update record
  async updateRecord(table, recordId, data) {
    const tbl = await this.datastore.getTable(table);
    const record = await tbl.getRecord(recordId);
    Object.keys(data).forEach(key => {
      record.set(key, data[key]);
    });
    await record.save();
    return record;
  }
}

module.exports = new CatalystDB();
