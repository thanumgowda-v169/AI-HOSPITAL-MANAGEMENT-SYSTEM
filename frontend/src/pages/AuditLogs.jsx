import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, ShieldCheck, Clock, User, Globe, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { Badge } from '../components/Badge';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resourceFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/audit/?';
      if (actionFilter) url += `action=${actionFilter}&`;
      if (resourceFilter) url += `resource_type=${resourceFilter}&`;
      const res = await api.get(url);
      setLogs(res);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900">Security & Operational Audit Trail</h2>
            <p className="text-xs text-slate-500">
              Immutable activity records tracking authentication, clinical updates, drug dispensing and admissions
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Audit Logging Active</span>
        </span>
      </div>

      {/* Filter Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-xs focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Actions (LOGIN, CREATE, UPDATE, DISPENSE, ADMISSION...)</option>
          <option value="LOGIN">LOGIN</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DISPENSE">DISPENSE</option>
          <option value="ADMISSION">ADMISSION</option>
          <option value="PAYMENT">PAYMENT</option>
        </select>

        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-xs focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Resource Modules</option>
          <option value="User">User</option>
          <option value="Patient">Patient</option>
          <option value="Appointment">Appointment</option>
          <option value="EMR">EMR</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Bed">Bed</option>
          <option value="Billing">Billing</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading audit events...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No audit logs match criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Resource</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-navy-900">{log.user_email}</td>
                    <td className="py-3 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold ${
                          log.action === 'LOGIN'
                            ? 'text-blue-600'
                            : log.action === 'CREATE'
                            ? 'text-emerald-600'
                            : log.action === 'DISPENSE'
                            ? 'text-teal-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans font-semibold text-slate-700">{log.resource_type}</td>
                    <td className="py-3 px-4 font-sans text-slate-700 max-w-sm truncate">{log.details}</td>
                    <td className="py-3 px-3 text-slate-400">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
