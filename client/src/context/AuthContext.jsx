import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getStoredToken, setStoredToken, getStoredUser, setStoredUser } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [activeShift, setActiveShift] = useState(null);
  const [settings, setSettings] = useState({
    store_name: 'Supermercado KiroPOS',
    store_document: 'J-12345678-9',
    phone: '+1 555-019-2834',
    email: 'contacto@kiropos.com',
    address: 'Av. Principal #45',
    tax_rate: '16',
    currency_symbol: '$',
    paper_size: '80mm',
    receipt_footer: '¡Gracias por su compra!'
  });
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error('Error cargando configuración:', err);
    }
  };

  const refreshShift = async () => {
    if (!token) return;
    try {
      const res = await api.getCurrentShift();
      if (res.success) {
        setActiveShift(res.shift);
      }
    } catch (err) {
      console.error('Error cargando turno:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            setStoredUser(res.user);
            await refreshShift();
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      await refreshSettings();
      setLoading(false);
    };

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    initAuth();

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [token]);

  const login = async (username, password) => {
    const res = await api.login({ username, password });
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      setStoredToken(res.token);
      setStoredUser(res.user);
      await refreshShift();
      return res.user;
    }
    throw new Error(res.error || 'Credenciales inválidas');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveShift(null);
    setStoredToken(null);
    setStoredUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    activeShift,
    refreshShift,
    settings,
    refreshSettings,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
