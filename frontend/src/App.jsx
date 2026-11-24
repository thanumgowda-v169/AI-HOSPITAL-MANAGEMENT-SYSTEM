import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AIIntelligence } from './pages/AIIntelligence';
import { Patients } from './pages/Patients';
import { Appointments } from './pages/Appointments';
import { Doctors } from './pages/Doctors';
import { EMR } from './pages/EMR';
import { Pharmacy } from './pages/Pharmacy';
import { Beds } from './pages/Beds';
import { Billing } from './pages/Billing';
import { AuditLogs } from './pages/AuditLogs';

const MainLayout = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!isAuthenticated) {
    return <Login />;
  }

  const tabTitles = {
    dashboard: 'Operational Dashboard',
    'ai-intelligence': 'AI Intelligence & Predictive Models',
    patients: 'Patient Directory & Registration',
    appointments: 'Appointment Scheduling & No-Show Predictor',
    doctors: 'Physicians & Clinical Departments',
    emr: 'Electronic Medical Records (EMR)',
    pharmacy: 'Pharmacy Inventory & Automated Reorders',
    beds: 'Bed Allocation & Ward Occupancy',
    billing: 'Invoicing & Settlement Records',
    audit: 'Security Activity & Audit Trail'
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentTab} />;
      case 'ai-intelligence':
        return <AIIntelligence />;
      case 'patients':
        return <Patients onNavigate={setCurrentTab} />;
      case 'appointments':
        return <Appointments />;
      case 'doctors':
        return <Doctors onNavigate={setCurrentTab} />;
      case 'emr':
        return <EMR />;
      case 'pharmacy':
        return <Pharmacy />;
      case 'beds':
        return <Beds onNavigate={setCurrentTab} />;
      case 'billing':
        return <Billing />;
      case 'audit':
        return <AuditLogs />;
      default:
        return <Dashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Header
          onOpenMobile={() => setIsMobileOpen(true)}
          currentTabTitle={tabTitles[currentTab] || 'CODE RED – SUSTAINIQ'}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
