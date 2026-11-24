import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  UserCheck,
  Plus,
  Activity,
  Layers,
  CheckCircle,
  X,
  AlertCircle,
  LogOut,
  Sparkles,
  Users
} from 'lucide-react';
import { api } from '../api/client';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export const Beds = ({ onNavigate }) => {
  const { hasRole } = useAuth();
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWardFilter, setSelectedWardFilter] = useState('');
  
  // Modals
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);

  const [admitForm, setAdmitForm] = useState({
    patient_id: '',
    doctor_id: '',
    admitting_diagnosis: 'Acute monitoring & supportive care',
    expected_discharge_date: new Date(Date.now() + 4*24*60*60*1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchBedData();
  }, [selectedWardFilter]);

  const fetchBedData = async () => {
    setLoading(true);
    try {
      let bedUrl = '/beds/?';
      if (selectedWardFilter) bedUrl += `ward_id=${selectedWardFilter}&`;
      
      const [wardRes, bedRes, patRes, docRes] = await Promise.all([
        api.get('/beds/wards'),
        api.get(bedUrl),
        api.get('/patients/?limit=100'),
        api.get('/doctors/')
      ]);
      setWards(wardRes);
      setBeds(bedRes);
      setPatients(patRes);
      setDoctors(docRes);

      if (patRes.length > 0) {
        setAdmitForm(prev => ({ ...prev, patient_id: patRes[0].id }));
      }
      if (docRes.length > 0) {
        setAdmitForm(prev => ({ ...prev, doctor_id: docRes[0].id }));
      }
    } catch (err) {
      console.error('Failed to load bed records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBed) return;
    try {
      await api.post('/beds/allocate', {
        bed_id: selectedBed.id,
        patient_id: parseInt(admitForm.patient_id, 10),
        doctor_id: parseInt(admitForm.doctor_id, 10),
        admitting_diagnosis: admitForm.admitting_diagnosis,
        expected_discharge_date: admitForm.expected_discharge_date
      });
      setAdmitModalOpen(false);
      fetchBedData();
    } catch (err) {
      alert(err.message || 'Failed to admit patient to bed');
    }
  };

  const handleDischarge = async (bed) => {
    if (!window.confirm(`Discharge patient from Bed ${bed.bed_number}?`)) return;
    try {
      // Find allocation id or update status
      const res = await api.put(`/beds/${bed.id}/status`, { status: 'Available' });
      fetchBedData();
    } catch (err) {
      alert(err.message || 'Failed to discharge bed');
    }
  };

  const totalBeds = beds.length;
  const occupiedCount = beds.filter(b => b.status === 'Occupied').length;
  const availableCount = beds.filter(b => b.status === 'Available').length;
  const reservedCount = beds.filter(b => b.status === 'Reserved').length;
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedCount / totalBeds) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900">Bed & Inpatient Ward Management</h2>
            <p className="text-xs text-slate-500">
              Real-time floor census, admission allocation, and AI surge capacity forecasts
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('ai-intelligence')}
          className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center space-x-2 border border-teal-200 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>AI Bed Forecast (Peak: 61 Beds)</span>
        </button>
      </div>

      {/* Ward Occupancy Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Hospital Beds</span>
          <span className="text-2xl font-extrabold text-navy-900 mt-1 block">{totalBeds}</span>
          <span className="text-xs text-slate-500 mt-1 block">Across 5 clinical wards</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Occupied Beds</span>
          <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{occupiedCount}</span>
          <span className="text-xs text-slate-500 mt-1 block">Current Inpatients ({occupancyPct}%)</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Available Ready Beds</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{availableCount}</span>
          <span className="text-xs text-slate-500 mt-1 block">Sanitized & unreserved</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Reserved / Hold</span>
          <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{reservedCount}</span>
          <span className="text-xs text-slate-500 mt-1 block">Pre-operative elective holds</span>
        </div>
      </div>

      {/* Ward Selection Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedWardFilter('')}
          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            !selectedWardFilter ? 'bg-teal-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Wards ({beds.length})
        </button>
        {wards.map((w) => (
          <button
            key={w.id}
            onClick={() => setSelectedWardFilter(w.id.toString())}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              selectedWardFilter === w.id.toString()
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {w.name} ({w.occupied_beds}/{w.total_beds})
          </button>
        ))}
      </div>

      {/* Visual Bed Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-navy-900">Interactive Ward Bed Matrix</h3>
            <p className="text-xs text-slate-500">Color-coded live bed status. Click an available bed to admit a patient.</p>
          </div>
          {/* Legend */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
              <span className="text-slate-600">Available</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-md bg-blue-600"></span>
              <span className="text-slate-600">Occupied</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-md bg-amber-400"></span>
              <span className="text-slate-600">Reserved</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-md bg-slate-300"></span>
              <span className="text-slate-600">Maintenance</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading bed matrix...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {beds.map((b) => {
              const isAvail = b.status === 'Available';
              const isOcc = b.status === 'Occupied';
              return (
                <div
                  key={b.id}
                  className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between min-h-[120px] ${
                    isAvail
                      ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400 hover:shadow-sm'
                      : isOcc
                      ? 'bg-blue-50/60 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-navy-900 text-xs tracking-tight">{b.bed_number}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAvail ? 'bg-emerald-500' : isOcc ? 'bg-blue-600 animate-pulse' : 'bg-amber-400'
                        }`}
                      ></span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{b.ward_name}</p>

                    {isOcc && b.current_patient_name && (
                      <div className="mt-2 text-[11px] font-bold text-navy-950 truncate">
                        👤 {b.current_patient_name}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                    {isAvail ? (
                      <button
                        onClick={() => {
                          setSelectedBed(b);
                          setAdmitModalOpen(true);
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 w-full text-center py-0.5 bg-emerald-100/60 rounded-md"
                      >
                        + Admit
                      </button>
                    ) : isOcc ? (
                      <button
                        onClick={() => handleDischarge(b)}
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 w-full text-center py-0.5 bg-blue-100/60 rounded-md"
                      >
                        Discharge
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic mx-auto">Reserved</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admit Patient Modal */}
      {admitModalOpen && selectedBed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-navy-900">Inpatient Bed Admission</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigning <span className="font-bold text-teal-700">Bed {selectedBed.bed_number}</span> ({selectedBed.ward_name})
            </p>

            <form onSubmit={handleAdmitSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Patient *</label>
                <select
                  value={admitForm.patient_id}
                  onChange={(e) => setAdmitForm({ ...admitForm, patient_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admitting Physician *</label>
                <select
                  value={admitForm.doctor_id}
                  onChange={(e) => setAdmitForm({ ...admitForm, doctor_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admitting Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  value={admitForm.admitting_diagnosis}
                  onChange={(e) => setAdmitForm({ ...admitForm, admitting_diagnosis: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Expected Discharge Date</label>
                <input
                  type="date"
                  value={admitForm.expected_discharge_date}
                  onChange={(e) => setAdmitForm({ ...admitForm, expected_discharge_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdmitModalOpen(false)}
                  className="px-3 py-2 font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold"
                >
                  Complete Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
