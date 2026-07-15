const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

// CRUD endpoints mapping with JWT authentication guard
router.get('/', authMiddleware, patientController.getAllPatients.bind(patientController));
router.get('/:id', authMiddleware, patientController.getPatientById.bind(patientController));
router.post('/', authMiddleware, patientController.createPatient.bind(patientController));
router.put('/:id', authMiddleware, patientController.updatePatient.bind(patientController));
router.delete('/:id', authMiddleware, patientController.deletePatient.bind(patientController));

module.exports = router;
