import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, CreditCard, Filter } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function CustomersPage() {
  const { settings } = useAuth();
  const currency = settings.currency_symbol || '$';

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Customer Modal (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    document_id: '',
    phone: '',
    email: '',
    address: '',
    category: 'simple',
    credit_limit: 0
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers();
      if (res.success) setCustomers(res.customers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      document_id: '',
      phone: '',
      email: '',
      address: '',
      category: 'simple',
      credit_limit: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      document_id: c.document_id || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      category: c.category || 'simple',
      credit_limit: c.credit_limit || 0
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData);
      } else {
        await api.createCustomer(formData);
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCustomer = async (id, name, debt) => {
    if (debt > 0) {
      alert(`No se puede eliminar el cliente "${name}" porque tiene una deuda pendiente de ${currency}${debt.toFixed(2)}.`);
      return;
    }
    if (window.confirm(`¿Está seguro de eliminar al cliente "${name}"?`)) {
      try {
        await api.deleteCustomer(id);
        loadCustomers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const s = search.toLowerCase();
    const matchesSearch =
      s === '' ||
      c.name.toLowerCase().includes(s) ||
      (c.document_id && c.document_id.toLowerCase().includes(s)) ||
      (c.phone && c.phone.includes(s));
    const matchesCategory =
      selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            <span>Directorio de Clientes y Categorización</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Clasificación por tipo ("Mayorista", "Frecuente", "Simple"), límites de crédito y seguimiento de compras.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all duration-150 active:scale-95"
        >
          <Plus className="w-4 h-4 text-sky-400" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, documento o teléfono..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Categoría:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
          >
            <option value="all">Todas las Categorías</option>
            <option value="mayorista">Mayorista (Precios al por mayor)</option>
            <option value="frecuente">Frecuente (Precios preferenciales)</option>
            <option value="simple">Simple (Precio regular)</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-3">Documento</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Contacto</th>
                <th className="py-3 px-3 text-right">Límite Crédito</th>
                <th className="py-3 px-3 text-right">Deuda Actual</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Cargando clientes...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      {c.address && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{c.address}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-mono">
                      {c.document_id || 'N/A'}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          c.category === 'mayorista'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                            : c.category === 'frecuente'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-slate-100 text-slate-700 border-slate-200/80'
                        }`}
                      >
                        {c.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 space-y-0.5">
                      {c.phone && (
                        <div className="flex items-center gap-1 text-[11px] font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Mail className="w-3 h-3" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-600 font-mono font-medium">
                      {c.credit_limit > 0 ? `${currency}${c.credit_limit.toFixed(2)}` : 'Sin límite'}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {c.current_debt > 0 ? (
                        <span className="font-mono font-black text-rose-600">
                          {currency}{c.current_debt.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Al día</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          title="Editar cliente"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(c.id, c.name, c.current_debt)}
                          title="Eliminar cliente"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT CUSTOMER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre Completo o Razón Social *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Distribuidora El Sol o Carlos Mendoza"
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Documento / DNI / RFC</label>
              <input
                type="text"
                value={formData.document_id}
                onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                placeholder="V-12345678"
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoría del Cliente *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
              >
                <option value="simple">Simple (Precio regular de mostrador)</option>
                <option value="frecuente">Frecuente (Aplica precio preferencial)</option>
                <option value="mayorista">Mayorista (Aplica precio al por mayor)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-0123"
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@ejemplo.com"
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Dirección Física</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle o avenida, ciudad..."
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Límite de Crédito Permitido ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.credit_limit}
              onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
              placeholder="0 = Sin límite"
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Si se fija en 0, el cliente no tiene restricción de límite de crédito.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm"
            >
              Guardar Cliente
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
