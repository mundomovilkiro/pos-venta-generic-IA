import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import DebtorsPage from './pages/DebtorsPage';
import PurchasesPage from './pages/PurchasesPage';
import ExpensesPage from './pages/ExpensesPage';
import CustomersPage from './pages/CustomersPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import PublicVirtualInvoicePage from './pages/PublicVirtualInvoicePage';

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('pos');

  // Check if current URL path is a public virtual invoice /factura/:number
  const path = window.location.pathname;
  if (path.startsWith('/factura/')) {
    const invoiceNumber = path.replace('/factura/', '');
    return <PublicVirtualInvoicePage invoiceNumber={invoiceNumber} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            Iniciando KiroPOS...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] flex flex-col selection:bg-slate-900 selection:text-white transition-colors duration-200">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 pb-12">
        {activeTab === 'pos' && <POSPage />}
        {activeTab === 'inventory' && <InventoryPage />}
        {activeTab === 'debtors' && <DebtorsPage />}
        {activeTab === 'purchases' && <PurchasesPage />}
        {activeTab === 'expenses' && <ExpensesPage />}
        {activeTab === 'customers' && <CustomersPage />}
        {activeTab === 'sales' && <SalesHistoryPage />}
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
