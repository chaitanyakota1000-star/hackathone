const patientService = require('../services/patientService');

class PatientController {
  getAllPatients(req, res) {
    try {
      const list = patientService.getAllPatients();
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  getPatientById(req, res) {
    try {
      const patient = patientService.getPatientById(req.params.id);
      res.status(200).json(patient);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  createPatient(req, res) {
    try {
      const newPatient = patientService.createPatient(req.body);
      res.status(201).json(newPatient);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  updatePatient(req, res) {
    try {
      const updated = patientService.updatePatient(req.params.id, req.body);
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  deletePatient(req, res) {
    try {
      const deleted = patientService.deletePatient(req.params.id);
      res.status(200).json({ message: 'Patient deleted successfully', deleted });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }
}

module.exports = new PatientController();
