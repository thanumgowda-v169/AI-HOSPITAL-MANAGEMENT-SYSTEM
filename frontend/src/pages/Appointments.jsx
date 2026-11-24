import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  Stethoscope,
  Building,
  BrainCircuit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Calendar as CalendarIcon,
  ListFilter,
  X
} from 'lucide-react';
import { api } from '../api/client';
import { Badge } from '../components/Badge';

export const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  
  // Filters
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');

  // Booking Modal
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const [bookForm, setBookForm] = useState({
    patient_id: '',
    doctor_id: '',
    department_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00 AM',
    reason: 'Routine Consultation',
    notes: ''
  });
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:00 AM');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, selectedStatus, selectedDoctor]);

  const fetchInitialData = async () => {
    try {
      const [docRes, deptRes, patRes] = await Promise.all([
        api.get('/doctors/'),
        api.get('/doctors/departments'),
        api.get('/patients/?limit=100')
      ]);
      setDoctors(docRes);
      setDepartments(deptRes);
      setPatients(patRes);
      if (docRes.length > 0 && deptRes.length > 0 && patRes.length > 0) {
        setBookForm(prev => ({
          ...prev,
          patient_id: patRes[0].id,
          doctor_id: docRes[0].id,
          department_id: deptRes[0].id
        }));
      }
    } catch (err) {
      console.error('Failed to load initial metadata:', err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let url = '/appointments/?';
      if (selectedDate) url += `appt_date=${selectedDate}&`;
      if (selectedStatus) url += `status=${selectedStatus}&`;
      if (selectedDoctor) url += `doctor_id=${selectedDoctor}&`;
      const res = await api.get(url);
      setAppointments(res);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/appointments/', {
        ...bookForm,
        patient_id: parseInt(bookForm.patient_id, 10),
        doctor_id: parseInt(bookForm.doctor_id, 10),
        department_id: parseInt(bookForm.department_id, 10),
      });
      setBookModalOpen(false);
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (apptId, newStatus) => {
    try {
      await api.put(`/appointments/${apptId}`, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    try {
      await api.put(`/appointments/${selectedAppt.id}`, {
        appointment_date: rescheduleDate,
        appointment_time: rescheduleTime
      });
      setRescheduleModalOpen(false);
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'Failed to reschedule appointment');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900">Appointment Management</h2>
            <p className="text-xs text-slate-500">
              Live booking schedule with integrated AI No-Show prediction risk scores
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* View toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'calendar' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Day Schedule
            </button>
          </div>

          <button
            onClick={() => setBookModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-xs focus:ring-2 focus:ring-teal-500"
        />

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-xs focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="No-show">No-show</option>
        </select>

        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-xs focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
          ))}
        </select>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">No appointments match the criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Appt #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Doctor & Dept</th>
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4">
                      <span className="flex items-center space-x-1 text-teal-700">
                        <BrainCircuit className="w-3.5 h-3.5" />
                        <span>AI No-Show Risk</span>
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{a.appointment_number}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-navy-900">{a.patient_name}</p>
                        <p className="text-[10px] text-teal-700 font-mono">{a.patient_code}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{a.doctor_name}</p>
                        <p className="text-[11px] text-slate-500">{a.department_name}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800">{a.appointment_date}</p>
                        <p className="text-[11px] text-teal-600 font-medium">{a.appointment_time}</p>
                      </td>
                      <td className="py-3 px-3">
                        <Badge status={a.status} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="group relative inline-block">
                          <div className="flex items-center space-x-2">
                            <Badge status={a.noshow_risk_level} />
                            <span className="text-[11px] font-bold text-slate-600">
                              {Math.round(a.noshow_risk_score * 100)}%
                            </span>
                          </div>
                          {a.noshow_risk_factors && (
                            <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-64 bg-slate-900 text-white p-2.5 rounded-xl text-[11px] shadow-xl z-20 pointer-events-none">
                              <p className="font-bold text-teal-300 mb-1">Contributing Factors:</p>
                              <p className="leading-relaxed">{a.noshow_risk_factors}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {a.status === 'Scheduled' && (
                          <button
                            onClick={() => handleStatusChange(a.id, 'Confirmed')}
                            className="px-2 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold"
                            title="Confirm Attendance"
                          >
                            Confirm
                          </button>
                        )}
                        {(a.status === 'Confirmed' || a.status === 'Scheduled') && (
                          <button
                            onClick={() => handleStatusChange(a.id, 'Completed')}
                            className="px-2 py-1 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 font-semibold"
                            title="Mark Consultation Completed"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedAppt(a);
                            setRescheduleDate(a.appointment_date);
                            setRescheduleTime(a.appointment_time);
                            setRescheduleModalOpen(true);
                          }}
                          className="px-2 py-1 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold"
                          title="Reschedule Date/Time"
                        >
                          Reschedule
                        </button>
                        {a.status !== 'Cancelled' && a.status !== 'Completed' && (
                          <button
                            onClick={() => handleStatusChange(a.id, 'Cancelled')}
                            className="px-2 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold"
                            title="Cancel Appointment"
                          >
                            Cancel
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
      ) : (
        /* Day Schedule / Timeline View */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-navy-900 mb-4 text-sm flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-teal-600" />
            <span>Time Slots Distribution</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-teal-700 text-xs">{a.appointment_time}</span>
                  <Badge status={a.status} />
                </div>
                <h4 className="font-bold text-navy-900 text-sm">{a.patient_name}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{a.doctor_name} • {a.department_name}</p>
                <p className="text-xs text-slate-500 italic mt-1 truncate">"{a.reason}"</p>
                
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Lead time: {a.lead_time_days}d</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-400">No-show risk:</span>
                    <Badge status={a.noshow_risk_level} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {bookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Book Patient Appointment</h3>
                <p className="text-xs text-slate-500">AI will automatically evaluate no-show risk probability</p>
              </div>
              <button onClick={() => setBookModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={bookForm.patient_id}
                  onChange={(e) => setBookForm({ ...bookForm, patient_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.patient_id}) - {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Department *</label>
                <select
                  required
                  value={bookForm.department_id}
                  onChange={(e) => setBookForm({ ...bookForm, department_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Doctor *</label>
                <select
                  required
                  value={bookForm.doctor_id}
                  onChange={(e) => setBookForm({ ...bookForm, doctor_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.specialization}) - Fee: ${d.consulting_fee}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={bookForm.appointment_date}
                    onChange={(e) => setBookForm({ ...bookForm, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot *</label>
                  <select
                    value={bookForm.appointment_time}
                    onChange={(e) => setBookForm({ ...bookForm, appointment_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:15 AM">11:15 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="04:15 PM">04:15 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Visit</label>
                <input
                  type="text"
                  placeholder="e.g. Chest pain follow-up, general physical"
                  value={bookForm.reason}
                  onChange={(e) => setBookForm({ ...bookForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-500/20"
                >
                  {submitting ? 'Booking & Inferencing...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && selectedAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-navy-900">Reschedule Appointment</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select a new date and time for {selectedAppt.patient_name} ({selectedAppt.appointment_number})
            </p>

            <form onSubmit={handleRescheduleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Date</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-3 py-2 font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
