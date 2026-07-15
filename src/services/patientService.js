// In-memory patient database
const patients = [
  { id: 1, name: 'John Doe', age: 34, gender: 'Male', diagnosis: 'Flu', status: 'Admitted', room: '102B' },
  { id: 2, name: 'Jane Smith', age: 29, gender: 'Female', diagnosis: 'Migraine', status: 'Discharged', room: 'Outpatient' }
];

class PatientService {
  getAllPatients() {
    return patients;
  }

  getPatientById(id) {
    const patient = patients.find(p => p.id === parseInt(id));
    if (!patient) {
      throw new Error('Patient not found');
    }
    return patient;
  }

  createPatient(patientData) {
    const { name, age, gender, diagnosis, status, room } = patientData;
    if (!name || !age || !gender || !diagnosis || !status || !room) {
      throw new Error('Missing required patient details');
    }

    const newPatient = {
      id: patients.length + 1,
      name,
      age: parseInt(age),
      gender,
      diagnosis,
      status,
      room
    };

    patients.push(newPatient);
    return newPatient;
  }

  updatePatient(id, updateData) {
    const patientIndex = patients.findIndex(p => p.id === parseInt(id));
    if (patientIndex === -1) {
      throw new Error('Patient not found');
    }

    // Merge new updates
    patients[patientIndex] = {
      ...patients[patientIndex],
      ...updateData,
      id: patients[patientIndex].id // Preserve ID
    };

    return patients[patientIndex];
  }

  deletePatient(id) {
    const patientIndex = patients.findIndex(p => p.id === parseInt(id));
    if (patientIndex === -1) {
      throw new Error('Patient not found');
    }
    const deleted = patients.splice(patientIndex, 1);
    return deleted[0];
  }
}

module.exports = new PatientService();
