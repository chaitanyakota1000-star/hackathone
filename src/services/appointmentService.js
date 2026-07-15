// In-memory appointments database
const appointments = [];

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

    const booked = [];

    for (const appt of appointmentsList) {
      const { doctorId, doctorName, date, timeSlot } = appt;
      
      if (!doctorId || !doctorName || !date || !timeSlot) {
        throw new Error('Missing required appointment parameter details');
      }

      const newAppt = {
        id: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: userId,
        doctorId: String(doctorId),
        doctorName: String(doctorName),
        date: String(date),
        timeSlot: String(timeSlot),
        bookedAt: new Date().toISOString()
      };

      appointments.push(newAppt);
      booked.push(newAppt);
    }

    return booked;
  }

  // Get appointments for audit / diagnostics
  getAllAppointments() {
    return [...appointments];
  }
}

module.exports = new AppointmentService();
