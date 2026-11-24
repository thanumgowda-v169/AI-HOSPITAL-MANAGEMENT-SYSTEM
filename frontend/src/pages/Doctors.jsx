import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Plus,
  Building,
  Mail,
  Phone,
  DoorOpen,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  X,
  CalendarCheck
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const Doctors = ({ onNavigate }) => {
  const { hasRole } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  
  // Modals
  const [addDoctorModalOpen, setAddDoctorModalOpen] = useState(false);
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);

  const [docForm, setDocForm] = useState({
    doctor_code: '',
    full_name: '',
    department_id: '',
    specialization: '',
    qualification: 'MD, FACC',
    phone: '',
    email: '',
    room_number: 'Room 201',
    consulting_fee: 500,
    availability_days: 'Mon,Tue,Wed,Thu,Fri',
    shift_start: '09:00 AM',
    shift_end: '05:00 PM',
    is_available: true
  });

  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    description: '',
    floor_number: 1,
    phone_extension: 'Ext-101'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docRes, deptRes] = await Promise.all([
        api.get('/doctors/'),
        api.get('/doctors/departments')
      ]);
      setDoctors(docRes);
      setDepartments(deptRes);
      if (deptRes.length > 0) {
        setDocForm(prev => ({ ...prev, department_id: deptRes[0].id }));
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/doctors/', {
        ...docForm,
        department_id: parseInt(docForm.department_id, 10),
        consulting_fee: parseFloat(docForm.consulting_fee)
      });
      setAddDoctorModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to add doctor');
    }
  };

  const handleAddDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/doctors/departments', {
        ...deptForm,
        floor_number: parseInt(deptForm.floor_number, 10)
      });
      setAddDeptModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to add department');
    }
  };

  const toggleAvailability = async (doc) => {
    try {
      await api.put(`/doctors/${doc.id}`, { is_available: !doc.is_available });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to toggle availability');
    }
  };

  const filteredDoctors = selectedDeptFilter
    ? doctors.filter(d => d.department_id === parseInt(selectedDeptFilter, 10))
    : doctors;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900">Doctors & Clinical Departments</h2>
            <p className="text-xs text-slate-500">Staff scheduling, availability, consulting charges and duty shifts</p>
          </div>
        </div>

        {hasRole(['Admin', 'Hospital Manager']) && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAddDeptModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Building className="w-4 h-4 text-slate-500" />
              <span>Add Department</span>
            </button>
            <button
              onClick={() => {
                setDocForm(prev => ({ ...prev, doctor_code: `DOC-${(doctors.length + 1).toString().padStart(3, '0')}` }));
                setAddDoctorModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Doctor</span>
            </button>
          </div>
        )}
      </div>

      {/* Departments Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedDeptFilter('')}
          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            !selectedDeptFilter ? 'bg-teal-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Departments ({doctors.length})
        </button>
        {departments.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDeptFilter(d.id.toString())}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              selectedDeptFilter === d.id.toString()
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {d.name} ({doctors.filter(doc => doc.department_id === d.id).length})
          </button>
        ))}
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading doctors...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-400 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                      {doc.full_name.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-navy-900 text-sm">{doc.full_name}</h4>
                      <p className="text-xs text-teal-600 font-semibold">{doc.specialization}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.is_available
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {doc.is_available ? 'Available' : 'On Leave'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department</span>
                    <span className="font-semibold text-slate-800">{doc.department_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Qualifications</span>
                    <span className="font-medium text-slate-700">{doc.qualification}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Consultation Fee</span>
                    <span className="font-bold text-navy-900">${doc.consulting_fee}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Room / Clinic</span>
                    <span className="font-medium text-slate-700">{doc.room_number || 'Room 101'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Duty Shift</span>
                    <span className="font-medium text-slate-700">{doc.shift_start} - {doc.shift_end}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => toggleAvailability(doc)}
                  className="text-xs font-semibold text-slate-500 hover:text-navy-900"
                >
                  Toggle Availability
                </button>
                <button
                  onClick={() => onNavigate('appointments')}
                  className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-bold transition-colors"
                >
                  Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      {addDoctorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-navy-900">Add Clinical Doctor</h3>
              <button onClick={() => setAddDoctorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDoctorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Doctor Code *</label>
                <input
                  type="text"
                  required
                  value={docForm.doctor_code}
                  onChange={(e) => setDocForm({ ...docForm, doctor_code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Full Name"
                  value={docForm.full_name}
                  onChange={(e) => setDocForm({ ...docForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department *</label>
                  <select
                    value={docForm.department_id}
                    onChange={(e) => setDocForm({ ...docForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Consulting Fee ($)</label>
                  <input
                    type="number"
                    value={docForm.consulting_fee}
                    onChange={(e) => setDocForm({ ...docForm, consulting_fee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Interventional Cardiology"
                  value={docForm.specialization}
                  onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddDoctorModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-bold"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {addDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-navy-900 mb-4">Add Department</h3>
            <form onSubmit={handleAddDeptSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dermatology"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Code</label>
                  <input
                    type="text"
                    required
                    placeholder="DERM"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Floor #</label>
                  <input
                    type="number"
                    value={deptForm.floor_number}
                    onChange={(e) => setDeptForm({ ...deptForm, floor_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddDeptModalOpen(false)}
                  className="px-3 py-2 font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
