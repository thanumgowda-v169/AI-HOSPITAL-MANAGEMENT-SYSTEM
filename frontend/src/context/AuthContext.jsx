import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = {
  admin: { email: 'admin@codered.health', password: 'Admin@123', label: 'Admin (Full Access)', role: 'Admin' },
  receptionist: { email: 'receptionist@codered.health', password: 'Reception@123', label: 'Receptionist (Desk & Appts)', role: 'Receptionist' },
  doctor: { email: 'doctor@codered.health', password: 'Doctor@123', label: 'Doctor (EMR & Prescriptions)', role: 'Doctor' },
  nurse: { email: 'nurse@codered.health', password: 'Nurse@123', label: 'Nurse (Beds & Vitals)', role: 'Nurse' },
  pharmacist: { email: 'pharmacist@codered.health', password: 'Pharmacy@123', label: 'Pharmacist (Inventory & Dispense)', role: 'Pharmacist' },
  manager: { email: 'manager@codered.health', password: 'Manager@123', label: 'Hospital Manager (Analytics & AI)', role: 'Hospital Manager' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('codered_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('codered_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('/auth/login', { email, password });
      const userData = {
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        user_id: data.user_id,
      };
      localStorage.setItem('codered_token', data.access_token);
      localStorage.setItem('codered_user', JSON.stringify(userData));
      setToken(data.access_token);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (roleKey) => {
    const cred = DEMO_CREDENTIALS[roleKey];
    if (cred) {
      return await login(cred.email, cred.password);
    }
  };

  const logout = () => {
    localStorage.removeItem('codered_token');
    localStorage.removeItem('codered_user');
    setUser(null);
    setToken(null);
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        quickLogin,
        logout,
        hasRole,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
