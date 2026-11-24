import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Heart,
  Phone,
  Calendar,
  AlertCircle,
  FileText,
  X,
  Check,
  Activity
} from 'lucide-react';
import { api } from '../api/client';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export const Patients = ({ onNavigate }) => {
  const { user, hasRole } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [patientAppts, setPatientAppts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    age: 35,
    gender: 'Male',
    blood_group: 'O+',
    phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: 'Spouse',
    allergies: '',
    chronic_conditions: '',
    status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [search, statusFilter]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      let url = '/patients/?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;
      const res = await api.get(url);
      setPatients(res);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegister = () => {
    setIsEditing(false);
    setFormData({
      full_name: '',
      age: 35,
      gender: 'Male',
      blood_group: 'O+',
      phone: '',
      email: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: 'Spouse',
      allergies: '',
      chronic_conditions: '',
      status: 'Active'
    });
    setRegisterModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setIsEditing(true);
    setSelectedPatient(p);
    setFormData({
      full_name: p.full_name,
      age: p.age,
      gender: p.gender,
      blood_group: p.blood_group,
      phone: p.phone,
      email: p.email || '',
      address: p.address || '',
      emergency_contact_name: p.emergency_contact_name || '',
      emergency_contact_phone: p.emergency_contact_phone || '',
      emergency_contact_relation: p.emergency_contact_relation || 'Spouse',
      allergies: p.allergies || '',
      chronic_conditions: p.chronic_conditions || '',
      status: p.status || 'Active'
    });
    setRegisterModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing && selectedPatient) {
        await api.put(`/patients/${selectedPatient.id}`, formData);
      } else {
        await api.post('/patients/', formData);
      }
      setRegisterModalOpen(false);
      fetchPatients();
    } catch (err) {
      alert(err.message || 'Error saving patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePatient = async (p) => {
    if (!window.confirm(`Are you sure you want to permanently delete patient ${p.full_name} (${p.patient_id})?`)) return;
    try {
      await api.delete(`/patients/${p.id}`);
      fetchPatients();
    } catch (err) {
      alert(err.message || 'Failed to delete patient');
    }
  };

  const handleViewProfile = async (p) => {
    setSelectedPatient(p);
    setProfileModalOpen(true);
    try {
      const [records, appts] = await Promise.all([
        api.get(`/emr/patient/${p.id}`),
        api.get(`/appointments/?patient_id=${p.id}`)
      ]);
      setPatientRecords(records);
      setPatientAppts(appts);
    } catch (err) {
      console.error('Failed to load profile details:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900">Patient Directory</h2>
            <p className="text-xs text-slate-500">Centralized patient database & electronic health profiles</p>
          </div>
        </div>

        <button
          onClick={handleOpenRegister}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, Patient ID (CR-2026-...) or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active Outpatient</option>
          <option value="Inpatient">Current Inpatient</option>
          <option value="Discharged">Discharged</option>
        </select>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No patients found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-3">Age / Sex</th>
                  <th className="py-3 px-3">Blood Group</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4">Allergies / Chronic</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{p.patient_id}</td>
                    <td className="py-3 px-4 font-bold text-navy-900">{p.full_name}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {p.age} yrs • {p.gender}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[11px]">
                        {p.blood_group}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{p.phone}</td>
                    <td className="py-3 px-3">
                      <Badge status={p.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                      {p.allergies || p.chronic_conditions ? (
                        <span>
                          {p.allergies && <span className="text-rose-600 font-semibold">{p.allergies}; </span>}
                          {p.chronic_conditions}
                        </span>
                      ) : (
                        <span className="text-slate-400">None recorded</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleViewProfile(p)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                        title="View Complete Profile & History"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit Patient Information"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {hasRole(['Admin']) && (
                        <button
                          onClick={() => handleDeletePatient(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50"
                          title="Delete Patient Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration & Edit Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-navy-900">
                  {isEditing ? 'Edit Patient Information' : 'New Patient Registration'}
                </h3>
                <p className="text-xs text-slate-500">
                  Unique hospital identifier will be generated automatically
                </p>
              </div>
              <button onClick={() => setRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Johnathan Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="125"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group *</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    placeholder="Street, City, Postal code"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Person</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 999-9999"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Known Drug Allergies</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Sulfa"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chronic Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Hypertension, Asthma"
                    value={formData.chronic_conditions}
                    onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20"
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update Patient' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Profile & Visit History Modal */}
      {profileModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-extrabold text-lg">
                  {selectedPatient.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-navy-900">{selectedPatient.full_name}</h3>
                  <p className="text-xs text-teal-700 font-mono font-bold">{selectedPatient.patient_id}</p>
                </div>
              </div>
              <button onClick={() => setProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Age & Gender</span>
                <span className="font-bold text-slate-800">{selectedPatient.age} yrs • {selectedPatient.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Blood Group</span>
                <span className="font-bold text-rose-600">{selectedPatient.blood_group}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Status</span>
                <Badge status={selectedPatient.status} />
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">Emergency Contact</span>
                <span className="font-bold text-slate-800">{selectedPatient.emergency_contact_phone || 'None'}</span>
              </div>
            </div>

            {/* Previous Consultations & Medical Records */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-navy-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Consultation History & EMR Notes ({patientRecords.length})</span>
              </h4>

              {patientRecords.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No medical records documented yet for this patient.</p>
              ) : (
                <div className="space-y-3">
                  {patientRecords.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-navy-900">{rec.diagnosis}</span>
                        <span className="text-slate-400">{new Date(rec.record_date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{rec.doctor_notes}</p>
                      
                      {rec.prescriptions && rec.prescriptions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
                            Prescribed Medications:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {rec.prescriptions.map((rx) =>
                              rx.items.map((item, idx) => (
                                <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                                  {item.medicine_name || 'Rx'} ({item.dosage} - {item.frequency})
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Appointments History */}
              <h4 className="text-sm font-bold text-navy-900 flex items-center space-x-2 pt-4">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Appointment Bookings ({patientAppts.length})</span>
              </h4>

              {patientAppts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No appointments on file.</p>
              ) : (
                <div className="space-y-2">
                  {patientAppts.map((a) => (
                    <div key={a.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-navy-900">{a.appointment_date} at {a.appointment_time}</span>
                        <p className="text-[11px] text-slate-500">{a.doctor_name} • {a.reason}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge status={a.status} />
                        <span className="text-[10px] font-semibold text-slate-400">Risk: {a.noshow_risk_level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
