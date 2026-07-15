const { getPool } = require('../config/db');

class AppointmentService {
  /**
   * Book a batch of staged appointments
   * @param {Array} appointmentsList 
   * @param {number} userId 
   */
  async createAppointments(appointmentsList, userId) {
    if (!appointmentsList || !Array.isArray(appointmentsList) || appointmentsList.length === 0) {
      throw new Error('Appointments list cannot be empty');
    }

    const pool = getPool();
    const booked = [];

    for (const appt of appointmentsList) {
      const { doctorId, doctorName, date, timeSlot } = appt;
      
      if (!doctorId || !doctorName || !date || !timeSlot) {
        throw new Error('Missing required appointment parameter details');
      }

      const id = `appt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      await pool.query(
        'INSERT INTO appointments (id, userId, doctorId, doctorName, date, timeSlot) VALUES (?, ?, ?, ?, ?, ?)',
        [id, userId, String(doctorId), String(doctorName), String(date), String(timeSlot)]
      );

      booked.push({
        id,
        userId,
        doctorId: String(doctorId),
        doctorName: String(doctorName),
        date: String(date),
        timeSlot: String(timeSlot),
        bookedAt: new Date().toISOString()
      });
    }

    return booked;
  }

  /**
   * Get all booked appointments
   */
  async getAllAppointments() {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM appointments');
    return rows;
  }
}

module.exports = new AppointmentService();
