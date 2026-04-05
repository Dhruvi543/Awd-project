const requiredDoctorFields = [
  'firstName',
  'lastName',
  'phone',
  'gender',
  'specialization',
  'experience',
  'qualification',
  'location',
  'licenseNo',
  'clinicHospitalType',
  'clinicHospitalName',
];

const hasValue = (value) => {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
};

const hasCompletedDoctorProfile = (doctor) => {
  if (!doctor || doctor.role !== 'doctor') {
    return false;
  }

  if (doctor.isApproved !== true) {
    return false;
  }

  if (doctor.profileComplete === false) {
    return false;
  }

  return requiredDoctorFields.every((field) => hasValue(doctor[field]));
};

export {
  requiredDoctorFields,
  hasCompletedDoctorProfile,
};
