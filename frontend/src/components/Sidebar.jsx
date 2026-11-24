import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  Users,
  CalendarCheck,
  Stethoscope,
  FileText,
  Pill,
  BedDouble,
  Receipt,
  ShieldAlert,
  LogOut,
  Activity,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ currentTab, onSelectTab, isMobileOpen, onCloseMobile }) => {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Receptionist', 'Doctor', 'Nurse', 'Pharmacist', 'Hospital Manager'] },
    { id: 'ai-intelligence', label: 'AI Intelligence', icon: BrainCircuit, badge: 'ML Live', roles: ['Admin', 'Doctor', 'Hospital Manager', 'Receptionist', 'Nurse', 'Pharmacist'] },
    { id: 'patients', label: 'Patient Management', icon: Users, roles: ['Admin', 'Receptionist', 'Doctor', 'Nurse', 'Hospital Manager'] },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck, roles: ['Admin', 'Receptionist', 'Doctor', 'Hospital Manager'] },
    { id: 'doctors', label: 'Doctors & Staff', icon: Stethoscope, roles: ['Admin', 'Hospital Manager', 'Receptionist', 'Doctor'] },
    { id: 'emr', label: 'Digital EMR & Notes', icon: FileText, roles: ['Admin', 'Doctor', 'Nurse', 'Hospital Manager'] },
    { id: 'pharmacy', label: 'Pharmacy & Stock', icon: Pill, roles: ['Admin', 'Pharmacist', 'Doctor', 'Nurse', 'Hospital Manager'] },
    { id: 'beds', label: 'Bed Management', icon: BedDouble, roles: ['Admin', 'Nurse', 'Hospital Manager', 'Receptionist', 'Doctor'] },
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt, roles: ['Admin', 'Receptionist', 'Hospital Manager'] },
    { id: 'audit', label: 'Security & Audit', icon: ShieldAlert, roles: ['Admin', 'Hospital Manager'] },
  ];

  const visibleNav = navItems.filter((item) => hasRole(item.roles));

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-navy-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-6 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight flex items-center space-x-1">
                <span className="text-rose-500">CODE RED</span>
                <span className="text-teal-400 font-light">|</span>
                <span className="text-white">SUSTAINIQ</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Smart Hospital AI
              </p>
            </div>
          </div>
        </div>

        {/* User profile card in sidebar */}
        <div className="px-5 py-4 border-b border-navy-800/60 bg-navy-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-teal-600/30 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold text-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.full_name}</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-medium text-teal-300 tracking-wide">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  active
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-navy-800 bg-navy-950/60">
          <div className="mb-3 px-2 py-2 rounded-lg bg-navy-900/80 border border-navy-700/50">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Model State</span>
              <span className="text-emerald-400 font-semibold flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                Trained & Live
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
