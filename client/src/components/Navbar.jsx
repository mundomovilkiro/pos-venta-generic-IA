import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  Truck,
  TrendingDown,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Wallet,
  Menu,
  X,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CashShiftModal from './CashShiftModal';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, activeShift, settings } = useAuth();
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dark Mode State with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const currency = settings.currency_symbol || '$';

  const navItems = [
    { id: 'pos', label: 'Ventas (POS)', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'debtors', label: 'Deudores & Abonos', icon: CreditCard, highlight: true },
    { id: 'purchases', label: 'Compras', icon: Truck },
    { id: 'expenses', label: 'Gastos', icon: TrendingDown },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'sales', label: 'Facturas', icon: FileText },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Brand */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div
                onClick={() => setActiveTab('pos')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-white font-black text-lg shadow-sm border border-slate-700/50 group-hover:scale-105 group-hover:border-primary-500/50 transition-all duration-200">
                  <span className="text-transparent bg-clip-text bg-gradient-to-tr from-sky-400 to-indigo-200 font-mono">K</span>
                </div>
                <div>
                  <h1 className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-primary-600 transition-colors">
                    {settings.store_name?.slice(0, 15) || 'KiroPOS'}
                  </h1>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-1">
                    Sistema POS Pro
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-150 active:scale-[0.98] ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                        : item.highlight
                        ? 'text-amber-800 hover:text-amber-900 hover:bg-amber-100/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-600' : ''}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Controls: Cash Drawer Button & User Profile */}
            <div className="flex items-center gap-2.5">
              {/* Cash Drawer Status Button */}
              <button
                type="button"
                onClick={() => setIsCashModalOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-[0.98] ${
                  activeShift
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80 shadow-2xs'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/80 animate-pulse'
                }`}
                title="Gestión de Arqueo y Turno de Caja"
              >
                <span className={`w-2 h-2 rounded-full ${activeShift ? 'bg-emerald-500 shadow-xs' : 'bg-rose-500'}`} />
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono">
                  {activeShift ? `Caja: ${currency}${activeShift.expected_cash?.toFixed(2) || '0.00'}` : 'Abrir Caja'}
                </span>
                <span className="sm:hidden">
                  {activeShift ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Dark Mode Toggle Button */}
              <button
                type="button"
                onClick={toggleDarkMode}
                title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-150 active:scale-95 border border-slate-200/80 shadow-2xs"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>

              {/* User Pill & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">{user?.role}</div>
                </div>
                <button
                  onClick={logout}
                  type="button"
                  title="Cerrar Sesión"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-150 active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold rounded-xl ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Cash Shift Modal */}
      <CashShiftModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
      />
    </>
  );
}
