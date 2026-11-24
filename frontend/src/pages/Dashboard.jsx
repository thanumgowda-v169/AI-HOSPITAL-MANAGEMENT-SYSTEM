import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  Stethoscope,
  BedDouble,
  Pill,
  AlertCircle,
  Activity,
  TrendingUp,
  BrainCircuit,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

export const Dashboard = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats');
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-slate-600">Loading Hospital Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
        <p className="font-bold">Error loading dashboard</p>
        <p>{error}</p>
        <button onClick={fetchStats} className="mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold">
          Retry
        </button>
      </div>
    );
  }

  const { kpis, charts, ai_insights } = data;
  const PIE_COLORS = ['#10b981', '#0d9488', '#0284c7', '#f43f5e', '#64748b'];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner with AI Operational Highlights */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-teal-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SustainIQ Machine Learning Suite Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hospital Operations Overview
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Real-time resource utilization, patient flow analytics, and proactive AI demand forecasts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('ai-intelligence')}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs flex items-center space-x-2 shadow-md shadow-teal-500/20 transition-colors"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Explore AI Intelligence</span>
            </button>
            <button
              onClick={() => onNavigate('appointments')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center space-x-2 border border-white/20 transition-colors"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Patients"
          value={kpis.total_patients}
          icon={Users}
          color="blue"
          subtitle="Registered in system"
          trend="+12% this mo"
        />
        <StatCard
          title="Today's Appointments"
          value={kpis.today_appointments}
          icon={CalendarCheck}
          color="teal"
          subtitle={`${ai_insights.high_risk_appointments_count} flagged high risk`}
          badge="Live"
        />
        <StatCard
          title="Available Doctors"
          value={`${kpis.available_doctors} / ${kpis.total_doctors}`}
          icon={Stethoscope}
          color="emerald"
          subtitle="Active on duty today"
        />
        <StatCard
          title="Today's Patient Volume"
          value={kpis.today_patient_count}
          icon={Activity}
          color="navy"
          subtitle="OPD + Emergency footfall"
        />
        <StatCard
          title="Occupied Beds"
          value={`${kpis.occupied_beds} / ${kpis.total_beds}`}
          icon={BedDouble}
          color="blue"
          subtitle={`Occupancy: ${kpis.bed_occupancy_pct}%`}
          badge={kpis.bed_occupancy_pct > 80 ? 'High' : 'Normal'}
        />
        <StatCard
          title="Available Beds"
          value={kpis.available_beds}
          icon={BedDouble}
          color="emerald"
          subtitle="Ready for admission"
        />
        <StatCard
          title="Total Medicines"
          value={kpis.total_medicines}
          icon={Pill}
          color="teal"
          subtitle="Catalogued SKU batches"
        />
        <StatCard
          title="Low-Stock Medicines"
          value={kpis.low_stock_medicines}
          icon={AlertCircle}
          color={kpis.low_stock_medicines > 0 ? 'rose' : 'emerald'}
          subtitle={`${ai_insights.critical_medicines_count} critical reorders`}
          badge={kpis.low_stock_medicines > 0 ? 'Action Needed' : 'Good'}
        />
      </div>

      {/* AI Advisory Callout Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-navy-900 text-sm">AI Resource Advisory Insights</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase">
                  Advisory Only
                </span>
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                {ai_insights.advisory_notes.map((note, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('ai-intelligence')}
            className="hidden sm:flex items-center space-x-1 text-xs font-bold text-teal-700 hover:text-teal-900 bg-white px-3 py-1.5 rounded-lg border border-teal-200 shadow-xs"
          >
            <span>View Models</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Patient Statistics */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-navy-900">Weekly Patient Statistics</h3>
              <p className="text-xs text-slate-500">Daily outpatient volume & admissions (past 7 days)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              OPD vs Admissions
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.weekly_patient_stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="patients" name="Outpatient Visits" fill="#0d9488" radius={[6, 6, 0, 0]} />
                <Bar dataKey="admissions" name="Inpatient Admissions" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Appointment Status Breakdown */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-navy-900">Appointment Statuses</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Breakdown of scheduled vs attended visits</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.monthly_appointment_stats}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {charts.monthly_appointment_stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {charts.monthly_appointment_stats.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                <span className="text-slate-600 truncate">{item.status}:</span>
                <span className="font-bold text-navy-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bed Occupancy by Ward */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-navy-900">Ward Occupancy Distribution</h3>
              <p className="text-xs text-slate-500">Current bed allocations across clinical wards</p>
            </div>
            <button onClick={() => onNavigate('beds')} className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              Manage Beds →
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.bed_occupancy_chart} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis dataKey="ward" type="category" stroke="#94a3b8" fontSize={11} width={130} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="occupied" name="Occupied" stackId="a" fill="#0284c7" radius={[0, 0, 0, 0]} />
                <Bar dataKey="available" name="Available" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient Admission & Discharge Trends */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-navy-900">Patient Admission Trends</h3>
              <p className="text-xs text-slate-500">14-day inpatient admissions vs discharges</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
              14-Day View
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.admission_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="admissions" name="Admissions" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorAdm)" />
                <Area type="monotone" dataKey="discharges" name="Discharges" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorDis)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
