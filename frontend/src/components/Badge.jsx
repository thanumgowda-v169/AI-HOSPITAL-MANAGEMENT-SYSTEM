import React from 'react';

export const Badge = ({ status, variant, className = '' }) => {
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  const s = (status || variant || '').toLowerCase();

  // No-Show Risk & Critical indicators
  if (s === 'low' || s === 'completed' || s === 'paid' || s === 'available' || s === 'healthy') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s === 'medium' || s === 'confirmed' || s === 'partially paid' || s === 'reserved' || s === 'warning' || s === 'tight') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (s === 'high' || s === 'no-show' || s === 'cancelled' || s === 'critical' || s === 'overcapacity alert') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (s === 'scheduled' || s === 'pending' || s === 'inpatient') {
    styles = 'bg-teal-50 text-teal-700 border-teal-200';
  } else if (s === 'occupied') {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (s === 'maintenance') {
    styles = 'bg-slate-100 text-slate-600 border-slate-300';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70 animate-pulse"></span>
      {status}
    </span>
  );
};
