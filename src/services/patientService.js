const { getPool } = require('../config/db');

class PatientService {
  /**
   * Get all patient records
   */
  async getAllPatients() {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM patients');
    return rows;
  }

  /**
   * Get patient record by id
   */
  async getPatientById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [parseInt(id)]);
    if (rows.length === 0) {
      throw new Error('Patient not found');
    }
    return rows[0];
  }

  /**
   * Create a new patient record
   */
  async createPatient(patientData) {
    const { name, age, gender, diagnosis, status, room } = patientData;
    if (!name || !age || !gender || !diagnosis || !status || !room) {
      throw new Error('Missing required patient details');
    }

    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO patients (name, age, gender, diagnosis, status, room) VALUES (?, ?, ?, ?, ?, ?)',
      [name, parseInt(age), gender, diagnosis, status, room]
    );

    return {
      id: result.insertId,
      name,
      age: parseInt(age),
      gender,
      diagnosis,
      status,
      room
    };
  }

  /**
   * Update an existing patient record
   */
  async updatePatient(id, updateData) {
    const pool = getPool();
    const [existing] = await pool.query('SELECT * FROM patients WHERE id = ?', [parseInt(id)]);
    if (existing.length === 0) {
      throw new Error('Patient not found');
    }

    const current = existing[0];
    const name = updateData.name !== undefined ? updateData.name : current.name;
    const age = updateData.age !== undefined ? parseInt(updateData.age) : current.age;
    const gender = updateData.gender !== undefined ? updateData.gender : current.gender;
    const diagnosis = updateData.diagnosis !== undefined ? updateData.diagnosis : current.diagnosis;
    const status = updateData.status !== undefined ? updateData.status : current.status;
    const room = updateData.room !== undefined ? updateData.room : current.room;

    await pool.query(
      'UPDATE patients SET name = ?, age = ?, gender = ?, diagnosis = ?, status = ?, room = ? WHERE id = ?',
      [name, age, gender, diagnosis, status, room, parseInt(id)]
    );

    return { id: parseInt(id), name, age, gender, diagnosis, status, room };
  }

  /**
   * Delete a patient record
   */
  async deletePatient(id) {
    const pool = getPool();
    const [existing] = await pool.query('SELECT * FROM patients WHERE id = ?', [parseInt(id)]);
    if (existing.length === 0) {
      throw new Error('Patient not found');
    }

    await pool.query('DELETE FROM patients WHERE id = ?', [parseInt(id)]);
    return existing[0];
  }
}

module.exports = new PatientService();
