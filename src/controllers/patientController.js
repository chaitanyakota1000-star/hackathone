const patientService = require('../services/patientService');

class PatientController {
  async getAllPatients(req, res) {
    try {
      const list = await patientService.getAllPatients();
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getPatientById(req, res) {
    try {
      const patient = await patientService.getPatientById(req.params.id);
      res.status(200).json(patient);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async createPatient(req, res) {
    try {
      const newPatient = await patientService.createPatient(req.body);
      res.status(201).json(newPatient);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async updatePatient(req, res) {
    try {
      const updated = await patientService.updatePatient(req.params.id, req.body);
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async deletePatient(req, res) {
    try {
      const deleted = await patientService.deletePatient(req.params.id);
      res.status(200).json({ message: 'Patient deleted successfully', deleted });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }
}

module.exports = new PatientController();
