import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  Printer,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  FileCheck,
  Building,
  HeartPulse
} from 'lucide-react';
import { api } from '../api/client';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export const Billing = () => {
  const { hasRole } = useAuth();
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // Form State
  const [billForm, setBillForm] = useState({
    patient_id: '',
    consultation_charges: 500.0,
    service_charges: 150.0,
    medicine_charges: 85.0,
    room_charges: 0.0,
    tax_rate_percent: 5.0,
    discount_amount: 0.0,
    notes: 'Outpatient consultation and pharmacy charge'
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'UPI',
    notes: 'Simulated digital transaction settlement'
  });

  useEffect(() => {
    fetchBills();
    fetchPatients();
  }, [statusFilter]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      let url = '/billing/?';
      if (statusFilter) url += `status=${statusFilter}&`;
      const res = await api.get(url);
      setBills(res);
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients/?limit=100');
      setPatients(res);
      if (res.length > 0) {
        setBillForm(prev => ({ ...prev, patient_id: res[0].id }));
      }
    } catch (err) {
      console.error('Failed to load patients for billing:', err);
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      await api.post('/billing/', {
        ...billForm,
        patient_id: parseInt(billForm.patient_id, 10),
        consultation_charges: parseFloat(billForm.consultation_charges),
        service_charges: parseFloat(billForm.service_charges),
        medicine_charges: parseFloat(billForm.medicine_charges),
        room_charges: parseFloat(billForm.room_charges),
        discount_amount: parseFloat(billForm.discount_amount),
      });
      setCreateModalOpen(false);
      fetchBills();
    } catch (err) {
      alert(err.message || 'Failed to create bill');
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;
    try {
      await api.post(`/billing/${selectedBill.id}/pay`, {
        bill_id: selectedBill.id,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes
      });
      setPayModalOpen(false);
      fetchBills();
    } catch (err) {
      alert(err.message || 'Failed to process payment');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900">Billing & Invoice Management</h2>
            <p className="text-xs text-slate-500">
              Generate itemized patient invoices, record simulated settlements and print official receipts
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Invoice</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center space-x-2 text-xs">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
            !statusFilter ? 'bg-teal-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Invoices ({bills.length})
        </button>
        <button
          onClick={() => setStatusFilter('Paid')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
            statusFilter === 'Paid' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Paid ({bills.filter(b => b.status === 'Paid').length})
        </button>
        <button
          onClick={() => setStatusFilter('Pending')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
            statusFilter === 'Pending' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending ({bills.filter(b => b.status === 'Pending').length})
        </button>
        <button
          onClick={() => setStatusFilter('Partially paid')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
            statusFilter === 'Partially paid' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Partially Paid
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading billing records...</div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Consultation</th>
                  <th className="py-3 px-3">Services / Rx</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Paid Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{b.invoice_number}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-navy-900">{b.patient_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{b.patient_code}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {new Date(b.issue_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">${b.consultation_charges}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      ${(b.service_charges + b.medicine_charges + b.room_charges).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-navy-900">${b.total_amount.toFixed(2)}</td>
                    <td className="py-3 px-3 font-bold text-emerald-700">${b.paid_amount.toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <Badge status={b.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {b.status !== 'Paid' && (
                        <button
                          onClick={() => {
                            setSelectedBill(b);
                            setPaymentForm(prev => ({ ...prev, amount: b.total_amount - b.paid_amount }));
                            setPayModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold"
                        >
                          Simulate Pay
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedBill(b);
                          setInvoiceModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
                      >
                        Print Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Bill Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-navy-900">Generate Patient Bill</h3>
            <p className="text-xs text-slate-500 mt-0.5">Itemize clinical charges and service fees</p>

            <form onSubmit={handleCreateBill} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Patient *</label>
                <select
                  value={billForm.patient_id}
                  onChange={(e) => setBillForm({ ...billForm, patient_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={billForm.consultation_charges}
                    onChange={(e) => setBillForm({ ...billForm, consultation_charges: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service / Lab Charges ($)</label>
                  <input
                    type="number"
                    value={billForm.service_charges}
                    onChange={(e) => setBillForm({ ...billForm, service_charges: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Medicine Charges ($)</label>
                  <input
                    type="number"
                    value={billForm.medicine_charges}
                    onChange={(e) => setBillForm({ ...billForm, medicine_charges: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Room / Bed Charges ($)</label>
                  <input
                    type="number"
                    value={billForm.room_charges}
                    onChange={(e) => setBillForm({ ...billForm, room_charges: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={billForm.tax_rate_percent}
                    onChange={(e) => setBillForm({ ...billForm, tax_rate_percent: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Amount ($)</label>
                  <input
                    type="number"
                    value={billForm.discount_amount}
                    onChange={(e) => setBillForm({ ...billForm, discount_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-2 font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Settlement Modal */}
      {payModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-navy-900">Simulate Payment</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Invoice <span className="font-bold text-teal-700">{selectedBill.invoice_number}</span> ({selectedBill.patient_name})
            </p>

            <form onSubmit={handleProcessPayment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-navy-900 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="UPI">UPI Digital Payment</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                  <option value="Cash">Cash at Counter</option>
                  <option value="Health Insurance">Health Insurance Claim</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-3 py-2 font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {invoiceModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 my-8">
            <div className="no-print flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Official Medical Receipt</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button onClick={() => setInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Container */}
            <div id="printable-invoice" className="space-y-6">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <HeartPulse className="w-6 h-6 text-rose-600" />
                    <span className="font-extrabold text-xl tracking-tight text-navy-950">CODE RED – SUSTAINIQ</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Apex Memorial Teaching Hospital & Trauma Center</p>
                  <p className="text-xs text-slate-400">100 Healthcare Boulevard, Metro City • +1 (555) 019-2000</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-extrabold text-navy-900 block">{selectedBill.invoice_number}</span>
                  <p className="text-xs text-slate-500">Date: {new Date(selectedBill.issue_date).toLocaleDateString()}</p>
                  <Badge status={selectedBill.status} className="mt-1" />
                </div>
              </div>

              {/* Patient Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Billed To:</span>
                  <span className="font-bold text-navy-900 text-sm">{selectedBill.patient_name}</span>
                  <p className="text-slate-600 font-mono mt-0.5">{selectedBill.patient_code}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block uppercase text-[10px]">Payment Method:</span>
                  <span className="font-bold text-slate-800">{selectedBill.payment_method || 'Pending'}</span>
                </div>
              </div>

              {/* Charges Table */}
              <table className="w-full text-xs text-left">
                <thead className="border-b border-slate-200 font-bold text-slate-500">
                  <tr>
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2 font-medium">Physician Consultation Fee</td>
                    <td className="py-2 text-right font-mono">${selectedBill.consultation_charges.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Diagnostic & Nursing Care Charges</td>
                    <td className="py-2 text-right font-mono">${selectedBill.service_charges.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Pharmaceutical Disbursals</td>
                    <td className="py-2 text-right font-mono">${selectedBill.medicine_charges.toFixed(2)}</td>
                  </tr>
                  {selectedBill.room_charges > 0 && (
                    <tr>
                      <td className="py-2 font-medium">Inpatient Ward Bed Charges</td>
                      <td className="py-2 text-right font-mono">${selectedBill.room_charges.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="border-t border-slate-200">
                    <td className="py-2 font-semibold text-slate-500">Applicable Tax ({selectedBill.tax_rate_percent}%)</td>
                    <td className="py-2 text-right font-mono">${selectedBill.tax_amount.toFixed(2)}</td>
                  </tr>
                  {selectedBill.discount_amount > 0 && (
                    <tr>
                      <td className="py-2 font-semibold text-emerald-600">Discount</td>
                      <td className="py-2 text-right font-mono text-emerald-600">-${selectedBill.discount_amount.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-slate-900 text-sm font-extrabold text-navy-950">
                    <td className="py-3">Grand Total</td>
                    <td className="py-3 text-right font-mono">${selectedBill.total_amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center italic">
                Thank you for choosing CODE RED Healthcare. This is a computer-generated medical invoice receipt.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
