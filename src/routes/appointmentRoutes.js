const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware');

// Booking endpoints mapping
router.post('/', authMiddleware, appointmentController.bookAppointments.bind(appointmentController));

module.exports = router;
