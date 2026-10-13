import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  History,
  Edit2,
  Trash2,
  Barcode,
  Layers,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function InventoryPage() {
  const { settings } = useAuth();
  const currency = settings.currency_symbol || '$';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [loading, setLoading] = useState(true);

  // Product Form Modal (Create / Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category_id: '',
    unit: 'unidad',
    cost_price: 0,
    price_regular: 0,
    price_frequent: 0,
    price_wholesale: 0,
    stock: 0,
    min_stock: 5,
    description: ''
  });

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustData, setAdjustData] = useState({
    adjustment_type: 'ENTRADA',
    quantity: '',
    reason: ''
  });

  // Kardex History Modal
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
  const [kardexProduct, setKardexProduct] = useState(null);
  const [movements, setMovements] = useState([]);

  // Category creation modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.getProducts(),
        api.getCategories()
      ]);
      if (prodRes.success) setProducts(prodRes.products);
      if (catRes.success) setCategories(catRes.categories);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: 'SKU-' + Date.now().toString().slice(-6),
      category_id: categories.length > 0 ? categories[0].id : '',
      unit: 'unidad',
      cost_price: '',
      price_regular: '',
      price_frequent: '',
      price_wholesale: '',
      stock: '',
      min_stock: 5,
      description: ''
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      barcode: p.barcode || '',
      category_id: p.category_id || '',
      unit: p.unit || 'unidad',
      cost_price: p.cost_price,
      price_regular: p.price_regular,
      price_frequent: p.price_frequent,
      price_wholesale: p.price_wholesale,
      stock: p.stock,
      min_stock: p.min_stock,
      description: p.description || ''
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.createProduct(formData);
      }
      setIsProductModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`¿Está seguro de desactivar el producto "${name}"?`)) {
      try {
        await api.deleteProduct(id);
        loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Stock Adjustment Submit
  const handleOpenAdjust = (p) => {
    setAdjustingProduct(p);
    setAdjustData({
      adjustment_type: 'ENTRADA',
      quantity: '',
      reason: ''
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.adjustStock(adjustingProduct.id, adjustData);
      setIsAdjustModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Kardex View
  const handleOpenKardex = async (p) => {
    try {
      const res = await api.getProduct(p.id);
      if (res.success) {
        setKardexProduct(res.product);
        setMovements(res.movements);
        setIsKardexModalOpen(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Category Add
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.createCategory({ name: newCategoryName });
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      const catRes = await api.getCategories();
      if (catRes.success) setCategories(catRes.categories);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'all' || p.category_id === parseInt(selectedCategory, 10);
    const matchesLowStock = !filterLowStock || p.stock <= p.min_stock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-600" />
            <span>Control de Inventario y Productos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de catálogo, precios diferenciados (regular, frecuente, mayorista) y auditoría Kardex.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Layers className="w-4 h-4" /> Categorías
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código de barras..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle Button */}
          <button
            type="button"
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${
              filterLowStock
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Bajo Stock ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-right">Costo</th>
                <th className="py-3 px-3 text-right">P. Simple</th>
                <th className="py-3 px-3 text-right">P. Frecuente</th>
                <th className="py-3 px-3 text-right">P. Mayorista</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Cargando productos...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= p.min_stock && p.stock > 0;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                          <Barcode className="w-3 h-3" />
                          <span>{p.barcode || 'Sin código'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {p.category_name || '-'}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-500">
                        {currency}{p.cost_price.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {currency}{p.price_regular.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                        {currency}{p.price_frequent.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-purple-700">
                        {currency}{p.price_wholesale.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            isOut
                              ? 'bg-red-100 text-red-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Stock adjustment button */}
                          <button
                            type="button"
                            onClick={() => handleOpenAdjust(p)}
                            title="Ajuste manual de stock"
                            className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>

                          {/* Kardex movement button */}
                          <button
                            type="button"
                            onClick={() => handleOpenKardex(p)}
                            title="Ver movimientos Kardex"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            title="Editar producto"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            title="Desactivar producto"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRODUCT CREATE / EDIT MODAL */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Nombre del Producto *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                placeholder="Ej. Harina de Maíz Precocida 1kg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Código de Barras / SKU</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-mono"
                  placeholder="Ej. 75010001"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, barcode: 'SKU-' + Date.now().toString().slice(-6) })}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl whitespace-nowrap"
                >
                  Generar
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoría</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Unidad de Medida</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              >
                <option value="unidad">Unidad (pz)</option>
                <option value="kg">Kilogramo (kg)</option>
                <option value="litro">Litro (lt)</option>
                <option value="paquete">Paquete</option>
                <option value="metro">Metro</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Precio Costo ({currency})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Pricing Tiers Section */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-800 text-xs">Precios Diferenciados por Categoría de Cliente</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">P. Regular / Simple *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price_regular}
                  onChange={(e) => setFormData({ ...formData, price_regular: e.target.value })}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-bold"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-800 mb-1">P. Frecuente</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_frequent}
                  onChange={(e) => setFormData({ ...formData, price_frequent: e.target.value })}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="block font-bold text-purple-800 mb-1">P. Mayorista</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_wholesale}
                  onChange={(e) => setFormData({ ...formData, price_wholesale: e.target.value })}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>

          {/* Stock Section */}
          <div className="grid grid-cols-2 gap-3">
            {!editingProduct && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Stock Inicial</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                  placeholder="0"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Stock Mínimo de Alerta</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                placeholder="5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm"
            >
              Guardar Producto
            </button>
          </div>
        </form>
      </Modal>

      {/* STOCK ADJUSTMENT MODAL */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Ajuste de Stock: ${adjustingProduct?.name || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveAdjust} className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
            <span className="text-slate-600">Stock Actual:</span>
            <span className="font-bold text-slate-900">{adjustingProduct?.stock} {adjustingProduct?.unit}</span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tipo de Ajuste</label>
            <select
              value={adjustData.adjustment_type}
              onChange={(e) => setAdjustData({ ...adjustData, adjustment_type: e.target.value })}
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-bold"
            >
              <option value="ENTRADA">ENTRADA (Aumentar Stock)</option>
              <option value="SALIDA">SALIDA (Disminuir Stock por Merma / Rotura)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cantidad a Ajustar *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={adjustData.quantity}
              onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Motivo del Ajuste *</label>
            <input
              type="text"
              required
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              placeholder="Ej. Conteo físico, vencimiento, merma..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl"
            >
              Aplicar Ajuste
            </button>
          </div>
        </form>
      </Modal>

      {/* KARDEX MOVEMENT AUDIT MODAL */}
      <Modal
        isOpen={isKardexModalOpen}
        onClose={() => setIsKardexModalOpen(false)}
        title={`Historial Kardex: ${kardexProduct?.name || ''}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-xs">
            <div>
              <span className="text-slate-500">Stock Actual: </span>
              <span className="font-bold text-slate-900">{kardexProduct?.stock} {kardexProduct?.unit}</span>
            </div>
            <div>
              <span className="text-slate-500">SKU: </span>
              <span className="font-mono text-slate-900">{kardexProduct?.barcode}</span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2 text-center">Cant.</th>
                  <th className="py-2 text-center">Previo</th>
                  <th className="py-2 text-center">Nuevo</th>
                  <th className="py-2">Motivo / Ref.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      Sin movimientos registrados.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2 text-slate-500">
                        {new Date(m.created_at).toLocaleDateString()}{' '}
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            m.movement_type.includes('ENTRADA') || m.movement_type === 'COMPRA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.movement_type}
                        </span>
                      </td>
                      <td className="py-2 text-center font-bold">{m.quantity}</td>
                      <td className="py-2 text-center text-slate-500">{m.previous_stock}</td>
                      <td className="py-2 text-center font-semibold text-slate-900">{m.new_stock}</td>
                      <td className="py-2 text-slate-600 truncate max-w-[150px]">
                        {m.reason} {m.reference_id && `(${m.reference_id})`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* CREATE CATEGORY MODAL */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Crear Nueva Categoría"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre de la Categoría *</label>
            <input
              type="text"
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              placeholder="Ej. Panadería, Farmacia, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl"
            >
              Crear Categoría
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
