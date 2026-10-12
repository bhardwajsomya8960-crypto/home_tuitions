const { v4: uuidv4 } = require('uuid');

class CatalystDB {
  constructor() {
    this.data = {
      parents: [],
      students: [],
      tutors: [],
      leads: [],
      demos: [],
      enrolments: [],
      classes: [],
      invoices: [],
      payments: [],
    };
  }

  async createParent(parentData) {
    const record = {
      id: uuidv4(),
      ...parentData,
      verification_status: 'verified',
      created_at: new Date(),
    };
    this.data.parents.push(record);
    return record;
  }

  async createStudent(studentData) {
    const record = {
      id: uuidv4(),
      ...studentData,
      created_at: new Date(),
    };
    this.data.students.push(record);
    return record;
  }

  async createTutor(tutorData) {
    const record = {
      id: uuidv4(),
      ...tutorData,
      service_radius: tutorData.service_radius || 8,
      verification_status: 'pending',
      created_at: new Date(),
    };
    this.data.tutors.push(record);
    return record;
  }

  async createLead(leadData) {
    const record = {
      id: uuidv4(),
      ...leadData,
      status: 'new',
      source: leadData.source || 'website',
      created_at: new Date(),
    };
    this.data.leads.push(record);
    return record;
  }

  async getTutorById(tutorId) {
    return this.data.tutors.find(t => t.id === tutorId) || null;
  }

  async findLeadsNearby(latitude, longitude, radiusKm) {
    return this.data.leads.filter(lead => {
      const distance = this.haversineDistance(
        latitude, longitude,
        lead.latitude, lead.longitude
      );
      return distance <= radiusKm;
    });
  }

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

  async updateRecord(table, recordId, data) {
    const records = this.data[table];
    const record = records.find(r => r.id === recordId);
    if (record) {
      Object.assign(record, data);
    }
    return record;
  }
}

module.exports = new CatalystDB();
