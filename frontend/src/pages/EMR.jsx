import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  User,
  Stethoscope,
  Pill,
  Activity,
  Heart,
  Thermometer,
  Lock,
  Calendar,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const EMR = () => {
  const { user, hasRole } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [records, setRecords] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Consultation Modal
  const [newConsultModalOpen, setNewConsultModalOpen] = useState(false);
  const [consultForm, setConsultForm] = useState({
    patient_id: '',
    doctor_id: '',
    chief_complaint: '',
    clinical_examination: '',
    diagnosis: '',
    icd10_code: 'I10',
    blood_pressure: '120/80',
    pulse_rate: 74,
    temperature: 98.6,
    respiratory_rate: 16,
    spo2: 98,
    doctor_notes: '',
    treatment_plan: '',
    is_confidential: false,
    prescription_items: []
  });

  const [prescriptionDraft, setPrescriptionDraft] = useState({
    medicine_id: '',
    dosage: '1 tablet',
    frequency: 'Once daily after food',
    duration_days: 7,
    quantity: 7,
    instructions: 'Take after meals'
  });

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientEMR(selectedPatientId);
    }
  }, [selectedPatientId]);

  const fetchMetadata = async () => {
    try {
      const [patRes, medRes, docRes] = await Promise.all([
        api.get('/patients/?limit=100'),
        api.get('/pharmacy/medicines'),
        api.get('/doctors/')
      ]);
      setPatients(patRes);
      setMedicines(medRes);
      setDoctors(docRes);
      if (patRes.length > 0) {
        setSelectedPatientId(patRes[0].id.toString());
      }
      if (medRes.length > 0) {
        setPrescriptionDraft(prev => ({ ...prev, medicine_id: medRes[0].id }));
      }
      if (docRes.length > 0) {
        setConsultForm(prev => ({ ...prev, doctor_id: docRes[0].id }));
      }
    } catch (err) {
      console.error('Failed to load EMR metadata:', err);
    }
  };

  const fetchPatientEMR = async (patId) => {
    setLoading(true);
    try {
      const res = await api.get(`/emr/patient/${patId}`);
      setRecords(res);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrescriptionItem = () => {
    const med = medicines.find(m => m.id === parseInt(prescriptionDraft.medicine_id, 10));
    setConsultForm(prev => ({
      ...prev,
      prescription_items: [
        ...prev.prescription_items,
        {
          ...prescriptionDraft,
          medicine_id: parseInt(prescriptionDraft.medicine_id, 10),
          medicine_name: med ? med.name : 'Medicine'
        }
      ]
    }));
  };

  const handleRemovePrescriptionItem = (index) => {
    setConsultForm(prev => ({
      ...prev,
      prescription_items: prev.prescription_items.filter((_, i) => i !== index)
    }));
  };

  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patient_id: parseInt(consultForm.patient_id, 10),
        doctor_id: parseInt(consultForm.doctor_id, 10),
        chief_complaint: consultForm.chief_complaint,
        clinical_examination: consultForm.clinical_examination,
        diagnosis: consultForm.diagnosis,
        icd10_code: consultForm.icd10_code,
        blood_pressure: consultForm.blood_pressure,
        pulse_rate: parseInt(consultForm.pulse_rate, 10),
        temperature: parseFloat(consultForm.temperature),
        respiratory_rate: parseInt(consultForm.respiratory_rate, 10),
        spo2: parseInt(consultForm.spo2, 10),
        doctor_notes: consultForm.doctor_notes,
        treatment_plan: consultForm.treatment_plan,
        is_confidential: consultForm.is_confidential,
        prescriptions: consultForm.prescription_items.length > 0 ? [{
          notes: 'Standard therapeutic regimen',
          items: consultForm.prescription_items
        }] : []
      };

      await api.post('/emr/', payload);
      setNewConsultModalOpen(false);
      fetchPatientEMR(selectedPatientId);
    } catch (err) {
      alert(err.message || 'Failed to record consultation');
    }
  };

  const currentPatient = patients.find(p => p.id === parseInt(selectedPatientId, 10));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900">Electronic Medical Records (EMR)</h2>
            <p className="text-xs text-slate-500">Digital clinical consultation notes, vital signs and digital prescriptions</p>
          </div>
        </div>

        {hasRole(['Doctor', 'Admin']) && (
          <button
            onClick={() => {
              setConsultForm(prev => ({
                ...prev,
                patient_id: selectedPatientId,
                doctor_id: doctors[0]?.id || 1,
                chief_complaint: '',
                clinical_examination: '',
                diagnosis: '',
                doctor_notes: '',
                prescription_items: []
              }));
              setNewConsultModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Consultation Note</span>
          </button>
        )}
      </div>

      {/* Patient Selector Dropdown Banner */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <User className="w-5 h-5 text-teal-600" />
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Active Patient Record
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="mt-0.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-navy-900 shadow-xs focus:ring-2 focus:ring-teal-500"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.patient_id}) - Age: {p.age}, {p.blood_group}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentPatient && (
          <div className="flex items-center space-x-3 text-xs bg-white px-4 py-2 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px]">Allergies</span>
              <span className="font-bold text-rose-600">{currentPatient.allergies || 'None'}</span>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-slate-400 block text-[10px]">Chronic Conditions</span>
              <span className="font-semibold text-slate-800">{currentPatient.chronic_conditions || 'None'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Consultation Records Timeline */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading medical history...</div>
      ) : records.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
          No medical records found for this patient. Click "New Consultation Note" to document a clinical visit.
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-navy-900 text-base">{rec.diagnosis}</h3>
                    {rec.icd10_code && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                        ICD-10: {rec.icd10_code}
                      </span>
                    )}
                    {rec.is_confidential && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>Confidential</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Consultant: <span className="font-semibold text-teal-700">{rec.doctor_name}</span> • Chief Complaint: "{rec.chief_complaint}"
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(rec.record_date).toLocaleString()}
                </span>
              </div>

              {/* Vitals Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Blood Pressure</span>
                  <span className="font-bold text-slate-800">{rec.blood_pressure || '--'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Pulse Rate</span>
                  <span className="font-bold text-slate-800">{rec.pulse_rate} bpm</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Temperature</span>
                  <span className="font-bold text-slate-800">{rec.temperature} °F</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Respiratory</span>
                  <span className="font-bold text-slate-800">{rec.respiratory_rate} /min</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Oxygen (SpO2)</span>
                  <span className="font-bold text-emerald-600">{rec.spo2}%</span>
                </div>
              </div>

              {/* Clinical Notes & Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {rec.clinical_examination && (
                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Clinical Findings & Examination</span>
                    <p className="text-slate-600 leading-relaxed">{rec.clinical_examination}</p>
                  </div>
                )}
                {rec.doctor_notes && (
                  <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Physician Advice & Regimen</span>
                    <p className="text-slate-600 leading-relaxed">{rec.doctor_notes}</p>
                  </div>
                )}
              </div>

              {/* Prescriptions */}
              {rec.prescriptions && rec.prescriptions.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-navy-900 block mb-2 flex items-center space-x-1.5">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span>Prescriptions Issued</span>
                  </span>
                  <div className="space-y-1.5">
                    {rec.prescriptions.map((rx) =>
                      rx.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-teal-50/50 border border-teal-100 text-xs">
                          <div>
                            <span className="font-bold text-navy-900">{item.medicine_name}</span>
                            <span className="text-slate-500 ml-2">({item.dosage} • {item.frequency})</span>
                          </div>
                          <span className="font-semibold text-teal-700">
                            {item.quantity} units ({item.duration_days} days) • {item.instructions}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Consultation Note Modal */}
      {newConsultModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Record Medical Consultation</h3>
                <p className="text-xs text-slate-500">Document clinical examination, vitals, diagnosis and digital prescriptions</p>
              </div>
              <button onClick={() => setNewConsultModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConsultation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Attending Physician *</label>
                  <select
                    value={consultForm.doctor_id}
                    onChange={(e) => setConsultForm({ ...consultForm, doctor_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Diagnosis *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Type 2 Diabetes, Acute Bronchitis"
                    value={consultForm.diagnosis}
                    onChange={(e) => setConsultForm({ ...consultForm, diagnosis: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chief Complaint *</label>
                <input
                  type="text"
                  required
                  placeholder="Patient reports progressive dyspnea and cough"
                  value={consultForm.chief_complaint}
                  onChange={(e) => setConsultForm({ ...consultForm, chief_complaint: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Vitals Input */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 block">Patient Vital Signs</span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">BP</label>
                    <input
                      type="text"
                      value={consultForm.blood_pressure}
                      onChange={(e) => setConsultForm({ ...consultForm, blood_pressure: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Pulse (bpm)</label>
                    <input
                      type="number"
                      value={consultForm.pulse_rate}
                      onChange={(e) => setConsultForm({ ...consultForm, pulse_rate: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={consultForm.temperature}
                      onChange={(e) => setConsultForm({ ...consultForm, temperature: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Resp (/min)</label>
                    <input
                      type="number"
                      value={consultForm.respiratory_rate}
                      onChange={(e) => setConsultForm({ ...consultForm, respiratory_rate: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">SpO2 (%)</label>
                    <input
                      type="number"
                      value={consultForm.spo2}
                      onChange={(e) => setConsultForm({ ...consultForm, spo2: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Notes & Recommendations</label>
                <textarea
                  rows="3"
                  placeholder="Physician notes, clinical recommendations and lifestyle modifications..."
                  value={consultForm.doctor_notes}
                  onChange={(e) => setConsultForm({ ...consultForm, doctor_notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              {/* Prescription builder */}
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 space-y-2">
                <span className="font-bold text-teal-900 block">Add Prescription Items</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={prescriptionDraft.medicine_id}
                      onChange={(e) => setPrescriptionDraft({ ...prescriptionDraft, medicine_id: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.category}) - Stock: {m.stock_quantity}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPrescriptionItem}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs"
                  >
                    + Add to Rx
                  </button>
                </div>

                {consultForm.prescription_items.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {consultForm.prescription_items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1 rounded-md border border-slate-200 text-[11px]">
                        <span>{item.medicine_name} ({item.dosage} - {item.frequency})</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePrescriptionItem(idx)}
                          className="text-rose-500 font-bold hover:text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewConsultModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                >
                  Record Consultation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
