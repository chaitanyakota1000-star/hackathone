const appointmentService = require('../services/appointmentService');

class AppointmentController {
  async bookAppointments(req, res) {
    try {
      const { appointments } = req.body;
      const userId = req.user ? req.user.userId : 'anonymous-patient';

      if (!appointments) {
        return res.status(400).json({ success: false, error: 'Missing appointments payload parameters' });
      }

      const booked = await appointmentService.createAppointments(appointments, userId);
      res.status(200).json({
        success: true,
        message: 'Appointments successfully confirmed and saved',
        booked: booked
      });
    } catch (err) {
      console.error("Booking Error:", err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }
}

module.exports = new AppointmentController();
