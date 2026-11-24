import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  ArrowDownCircle,
  PackageCheck,
  Calendar,
  Layers,
  X,
  TrendingDown
} from 'lucide-react';
import { api } from '../api/client';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export const Pharmacy = () => {
  const { hasRole } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [nearExpiryFilter, setNearExpiryFilter] = useState(false);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Add Med Form
  const [medForm, setMedForm] = useState({
    name: '',
    generic_name: '',
    category: 'Antibiotics',
    manufacturer: 'Apex Biopharma',
    batch_number: 'BCH-2026-X99',
    unit_price: 15.0,
    stock_quantity: 100,
    reorder_level: 25,
    expiry_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
    unit_type: 'Tablets',
    dosage_form: '500mg'
  });

  // Dispense Form
  const [dispenseForm, setDispenseForm] = useState({
    patient_id: '',
    quantity: 10,
    notes: 'Outpatient dispensary issue'
  });

  useEffect(() => {
    fetchMedicines();
    fetchPatients();
  }, [search, categoryFilter, lowStockFilter, nearExpiryFilter]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      let url = '/pharmacy/medicines?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}&`;
      if (lowStockFilter) url += `low_stock_only=true&`;
      if (nearExpiryFilter) url += `near_expiry_only=true&`;
      const res = await api.get(url);
      setMedicines(res);
    } catch (err) {
      console.error('Failed to load medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients/?limit=100');
      setPatients(res);
      if (res.length > 0) {
        setDispenseForm(prev => ({ ...prev, patient_id: res[0].id }));
      }
    } catch (err) {
      console.error('Failed to load patients for dispensary:', err);
    }
  };

  const handleAddMedicineSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pharmacy/medicines', {
        ...medForm,
        unit_price: parseFloat(medForm.unit_price),
        stock_quantity: parseInt(medForm.stock_quantity, 10),
        reorder_level: parseInt(medForm.reorder_level, 10)
      });
      setAddModalOpen(false);
      fetchMedicines();
    } catch (err) {
      alert(err.message || 'Failed to add medicine');
    }
  };

  const handleDispenseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMedicine) return;
    try {
      await api.post('/pharmacy/dispense', {
        medicine_id: selectedMedicine.id,
        patient_id: parseInt(dispenseForm.patient_id, 10),
        quantity: parseInt(dispenseForm.quantity, 10),
        transaction_type: 'DISPENSED',
        notes: dispenseForm.notes
      });
      setDispenseModalOpen(false);
      fetchMedicines();
    } catch (err) {
      alert(err.message || 'Failed to dispense medicine');
    }
  };

  const categories = Array.from(new Set(medicines.map(m => m.category))).filter(Boolean);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900">Pharmacy & Stock Management</h2>
            <p className="text-xs text-slate-500">
              Batch inventory tracking, real-time stock levels, expiry monitoring and digital dispensing
            </p>
          </div>
        </div>

        {hasRole(['Pharmacist', 'Admin']) && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medication</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine name, generic drug, or batch number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium shadow-xs"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              lowStockFilter
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            ⚠️ Low Stock Only
          </button>
          <button
            onClick={() => setNearExpiryFilter(!nearExpiryFilter)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              nearExpiryFilter
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            ⌛ Near Expiry
          </button>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading pharmacy stock...</div>
        ) : medicines.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No medications match the search filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Brand / Generic Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Batch #</th>
                  <th className="py-3 px-3">Unit Price</th>
                  <th className="py-3 px-3">Stock Qty</th>
                  <th className="py-3 px-3">Reorder Point</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{m.medicine_code}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-navy-900">{m.name}</p>
                      <p className="text-[10px] text-slate-500">{m.generic_name}</p>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">{m.category}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{m.batch_number}</td>
                    <td className="py-3 px-3 font-bold text-navy-900">${m.unit_price.toFixed(2)}</td>
                    <td className="py-3 px-3 font-bold">
                      <span
                        className={
                          m.is_low_stock ? 'text-rose-600 font-extrabold' : 'text-emerald-700'
                        }
                      >
                        {m.stock_quantity} {m.unit_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{m.reorder_level} units</td>
                    <td className="py-3 px-3">
                      <span
                        className={
                          m.is_near_expiry ? 'text-amber-600 font-bold' : 'text-slate-600'
                        }
                      >
                        {m.expiry_date}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {hasRole(['Pharmacist', 'Nurse', 'Admin']) && (
                        <button
                          onClick={() => {
                            setSelectedMedicine(m);
                            setDispenseModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg transition-colors"
                        >
                          Dispense
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

      {/* Add Medicine Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-navy-900">Add Pharmacy Medicine</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicineSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trade/Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Augmentin 625mg"
                    value={medForm.name}
                    onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Generic Chemical</label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin + Clavulanate"
                    value={medForm.generic_name}
                    onChange={(e) => setMedForm({ ...medForm, generic_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={medForm.category}
                    onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Analgesics">Analgesics</option>
                    <option value="Antipyretics">Antipyretics</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="Emergency / Critical">Emergency / Critical</option>
                    <option value="IV Fluids">IV Fluids</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={medForm.batch_number}
                    onChange={(e) => setMedForm({ ...medForm, batch_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={medForm.unit_price}
                    onChange={(e) => setMedForm({ ...medForm, unit_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={medForm.stock_quantity}
                    onChange={(e) => setMedForm({ ...medForm, stock_quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reorder Point</label>
                  <input
                    type="number"
                    value={medForm.reorder_level}
                    onChange={(e) => setMedForm({ ...medForm, reorder_level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={medForm.expiry_date}
                    onChange={(e) => setMedForm({ ...medForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Type</label>
                  <select
                    value={medForm.unit_type}
                    onChange={(e) => setMedForm({ ...medForm, unit_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Tablets">Tablets</option>
                    <option value="Capsules">Capsules</option>
                    <option value="Vial">Vial</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="IV Bag">IV Bag</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-bold"
                >
                  Save Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispense Modal */}
      {dispenseModalOpen && selectedMedicine && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-navy-900">Dispense Medication</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dispensing <span className="font-bold text-teal-700">{selectedMedicine.name}</span> (Available: {selectedMedicine.stock_quantity})
            </p>

            <form onSubmit={handleDispenseSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Patient *</label>
                <select
                  value={dispenseForm.patient_id}
                  onChange={(e) => setDispenseForm({ ...dispenseForm, patient_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Quantity to Dispense *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedMedicine.stock_quantity}
                  value={dispenseForm.quantity}
                  onChange={(e) => setDispenseForm({ ...dispenseForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dispensing Remarks</label>
                <input
                  type="text"
                  value={dispenseForm.notes}
                  onChange={(e) => setDispenseForm({ ...dispenseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDispenseModalOpen(false)}
                  className="px-3 py-2 font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold"
                >
                  Confirm Dispense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
