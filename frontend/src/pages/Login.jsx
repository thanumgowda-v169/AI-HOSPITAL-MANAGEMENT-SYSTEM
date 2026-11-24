import React, { useState } from 'react';
import { HeartPulse, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Activity, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { api } from '../api/client';

export const Login = () => {
  const { login, quickLogin, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login(email, password);
    } catch {
      // error handled in context
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail,
        new_password: newPassword
      });
      setForgotMsg({ type: 'success', text: res.message });
      setTimeout(() => {
        setForgotModalOpen(false);
        setForgotMsg(null);
      }, 2500);
    } catch (err) {
      setForgotMsg({ type: 'error', text: err.message || 'Failed to reset password' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-100 z-10">
        
        {/* Left Column: Hospital Vision & Tech Pitch */}
        <div className="lg:col-span-5 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-8 sm:p-10 text-white flex flex-col justify-between relative">
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <HeartPulse className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-xl tracking-tight flex items-center space-x-1.5">
                  <span className="text-rose-500">CODE RED</span>
                  <span className="text-teal-400">|</span>
                  <span className="text-white">SUSTAINIQ</span>
                </div>
                <p className="text-[11px] text-teal-300 font-semibold tracking-wider uppercase">
                  AI-Powered Smart Hospital
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Intelligent Clinical & Operational Orchestration.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Connects patient management, EMR, pharmacy inventory, and bed allocation with predictive machine learning to eliminate stock-outs and minimize appointment no-shows.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-start space-x-3 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
                <Sparkles className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">AI No-Show Classifier</span>
                  Random Forest model estimating appointment attendance risk in real time.
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
                <Activity className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Time-Series Patient & Bed Forecasting</span>
                  Holt-Winters 7-day seasonal model predicting admission curves and surge bed demands.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-navy-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>College Hackathon Prototype</span>
            <span className="text-teal-400 font-medium">FastAPI + React + PostgreSQL</span>
          </div>
        </div>

        {/* Right Column: Interactive Login Form + 1-Click Role Fill */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-navy-900 tracking-tight">System Login</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Authenticate using hospital credentials or select a demo role below
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-teal-600" />
                RBAC Active
              </span>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@codered.health"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotModalOpen(true);
                      setForgotEmail(email || 'admin@codered.health');
                    }}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all duration-150 disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Enter Hospital Platform</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* 1-Click Demo Accounts Quick Select Grid */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center">
                <span>1-Click Demo Role Accounts (Instant Sign-In)</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(DEMO_CREDENTIALS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => quickLogin(key)}
                    className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-300 text-left transition-all duration-150 group"
                  >
                    <p className="text-xs font-bold text-navy-900 group-hover:text-teal-700">{item.role}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="text-lg font-bold text-navy-900">Reset Account Password</h4>
            <p className="text-xs text-slate-500 mt-1">
              Enter your email address and new password to update your login credentials.
            </p>

            {forgotMsg && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-semibold ${
                  forgotMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {forgotMsg.text}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
                >
                  {forgotLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
