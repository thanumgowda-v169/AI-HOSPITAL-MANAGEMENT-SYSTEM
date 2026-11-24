import React, { useState } from 'react';
import { Menu, Bell, Search, Shield, ChevronDown, UserCheck, AlertTriangle } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';

export const Header = ({ onOpenMobile, currentTabTitle }) => {
  const { user, quickLogin } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-navy-900 tracking-tight flex items-center space-x-2">
            <span>{currentTabTitle}</span>
          </h1>
          <p className="hidden sm:block text-xs text-slate-500">
            CODE RED Hospital Operations & Resource Orchestration
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Quick Role Switcher Pill for Judges / Testers */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-800 text-xs font-semibold hover:bg-teal-100/70 transition-colors shadow-sm"
            title="Click to quickly switch user role"
          >
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Active Role:</span>
            <span className="font-bold underline decoration-teal-400">{user?.role}</span>
            <ChevronDown className="w-3 h-3 text-teal-600 ml-0.5" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Demo Account (1-Click)
                </p>
              </div>
              {Object.entries(DEMO_CREDENTIALS).map(([key, item]) => {
                const isActive = user?.role === item.role;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setRoleMenuOpen(false);
                      quickLogin(key);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{item.role}</p>
                      <p className="text-[10px] text-slate-400">{item.email}</p>
                    </div>
                    {isActive && <UserCheck className="w-4 h-4 text-teal-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Advisory Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>AI Engine Advisory</span>
        </div>
      </div>
    </header>
  );
};
