import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../api/apiService';
import { UserRole } from '../../common/enums/enumConstant';

const roleTabs = [
  { value: 'all', label: 'All Users' },
  { value: UserRole.DOCTOR, label: 'Doctors' },
  { value: UserRole.PATIENT, label: 'Patients' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRole, setActiveRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [doctorResponse, patientResponse] = await Promise.all([
        apiService.getAllDoctors({ limit: 100 }),
        apiService.getAllPatients({ limit: 100 }),
      ]);

      const doctorUsers =
        doctorResponse.data?.data?.map((doctor) => ({
          id: doctor._id,
          name: [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') || doctor.email || 'Unnamed Doctor',
          email: doctor.email,
          role: UserRole.DOCTOR,
          status: doctor.status || 'pending',
          details: doctor.specialization || 'General Practitioner',
        })) || [];

      const patientUsers =
        patientResponse.data?.data?.map((patient) => ({
          id: patient._id,
          name: patient.name || patient.email || 'Unnamed Patient',
          email: patient.email,
          role: UserRole.PATIENT,
          status: patient.gender || 'n/a',
          details: patient.phone ? `Phone: ${patient.phone}` : 'No phone on record',
        })) || [];

      setUsers([...doctorUsers, ...patientUsers]);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to fetch users right now.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const doctors = users.filter((user) => user.role === UserRole.DOCTOR).length;
    const patients = users.filter((user) => user.role === UserRole.PATIENT).length;
    return {
      total: users.length,
      doctors,
      patients,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = activeRole === 'all' || user.role === activeRole;
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.details?.toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [users, activeRole, searchTerm]);

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review both recent doctors and patients in a single unified list.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Doctors</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.doctors}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Patients</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.patients}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-200 dark:border-gray-700">
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
              {roleTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveRole(tab.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeRole === tab.value
                      ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 lg:max-w-sm">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search users
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, email or detail"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">Loading users...</div>
            ) : error ? (
              <div className="text-center text-red-600 dark:text-red-400 py-12">{error}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                No users match your current filters.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={`${user.role}-${user.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email || 'No email provided'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.details}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === UserRole.DOCTOR
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {user.role}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;

