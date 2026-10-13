import React, { useState, useEffect } from 'react';
import { Settings, Save, Store, ShieldCheck, UserPlus, CheckCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function SettingsPage() {
  const { settings, refreshSettings, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    store_name: '',
    store_document: '',
    phone: '',
    email: '',
    address: '',
    tax_rate: '16',
    currency_symbol: '$',
    paper_size: '80mm',
    receipt_footer: ''
  });

  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New User Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'cajero'
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        store_name: settings.store_name || '',
        store_document: settings.store_document || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        tax_rate: settings.tax_rate || '16',
        currency_symbol: settings.currency_symbol || '$',
        paper_size: settings.paper_size || '80mm',
        receipt_footer: settings.receipt_footer || ''
      });
    }

    if (isAdmin) {
      loadUsers();
    }
  }, [settings, isAdmin]);

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res.success) setUsers(res.users);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings(formData);
      await refreshSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(newUserData);
      setIsUserModalOpen(false);
      setNewUserData({ username: '', password: '', name: '', role: 'cajero' });
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-600" />
          <span>Configuración del Sistema POS</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Parámetros del negocio, datos fiscales, formato predeterminado de ticket térmico y usuarios.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Configuración guardada exitosamente.</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 text-sm font-bold text-slate-800">
            <Store className="w-4 h-4 text-primary-600" />
            <span>Datos de la Empresa / Negocio</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre Comercial de la Tienda *</label>
              <input
                type="text"
                required
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Documento Fiscal (RUC / RFC / NIT)</label>
              <input
                type="text"
                value={formData.store_document}
                onChange={(e) => setFormData({ ...formData, store_document: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Dirección Fiscal / Ubicación</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 pb-3 border-b border-slate-200 text-sm font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            <span>Moneda, Impuestos y Formato de Impresión</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Símbolo de Moneda</label>
              <input
                type="text"
                value={formData.currency_symbol}
                onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Impuesto / IVA (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Papel Térmico Predeterminado</label>
              <select
                value={formData.paper_size}
                onChange={(e) => setFormData({ ...formData, paper_size: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-semibold"
              >
                <option value="80mm">80mm (Estándar Punto de Venta)</option>
                <option value="58mm">58mm (Mini Impresora Térmica)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Mensaje al Pie del Ticket</label>
              <input
                type="text"
                value={formData.receipt_footer}
                onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
                placeholder="¡Gracias por su compra! Vuelva pronto."
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* User Accounts Management (Admin only) */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Cajeros y Usuarios del Sistema</h3>
              <p className="text-xs text-slate-500">Gestión de accesos y credenciales para el personal.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl border border-primary-200"
            >
              <UserPlus className="w-4 h-4" /> + Nuevo Cajero
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Nombre</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Fecha Alta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{u.username}</td>
                    <td className="py-2.5 px-3 text-slate-800">{u.name}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Crear Nuevo Usuario / Cajero"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              value={newUserData.name}
              onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
              placeholder="Ej. Ana Lucía Pérez"
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre de Usuario (Login) *</label>
            <input
              type="text"
              required
              value={newUserData.username}
              onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
              placeholder="Ej. anaperez"
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Contraseña *</label>
            <input
              type="password"
              required
              value={newUserData.password}
              onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Rol / Permisos</label>
            <select
              value={newUserData.role}
              onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-semibold"
            >
              <option value="cajero">Cajero (Ventas, Clientes, Deudores)</option>
              <option value="admin">Administrador (Control Total)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl"
            >
              Crear Usuario
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
