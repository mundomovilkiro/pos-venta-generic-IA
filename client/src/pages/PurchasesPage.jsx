import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, FileText, Calendar, Trash2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function PurchasesPage() {
  const { settings } = useAuth();
  const currency = settings.currency_symbol || '$';

  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Purchase Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierDoc, setSupplierDoc] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [notes, setNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([]);

  // Line item builder in modal
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [itemQty, setItemQty] = useState('1');

  // Purchase Detail Modal
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [viewingItems, setViewingItems] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purRes, prodRes] = await Promise.all([
        api.getPurchases(),
        api.getProducts()
      ]);
      if (purRes.success) setPurchases(purRes.purchases);
      if (prodRes.success) setProducts(prodRes.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNew = () => {
    setSupplierName('');
    setSupplierDoc('');
    setPaymentMethod('efectivo');
    setNotes('');
    setPurchaseItems([]);
    setSelectedProduct(products.length > 0 ? products[0].id : '');
    setItemCost(products.length > 0 ? products[0].cost_price.toString() : '');
    setItemQty('1');
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    const prodId = parseInt(selectedProduct, 10);
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const cost = parseFloat(itemCost);
    const qty = parseFloat(itemQty);
    if (isNaN(cost) || cost < 0 || isNaN(qty) || qty <= 0) {
      alert('Costo y cantidad deben ser números válidos mayores a cero.');
      return;
    }

    setPurchaseItems([
      ...purchaseItems,
      {
        product_id: prod.id,
        name: prod.name,
        unit_cost: cost,
        quantity: qty,
        subtotal: cost * qty
      }
    ]);

    setItemQty('1');
  };

  const handleRemoveItem = (idx) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (purchaseItems.length === 0) {
      alert('Debe agregar al menos un ítem a la compra.');
      return;
    }

    try {
      await api.createPurchase({
        supplier_name: supplierName,
        supplier_document: supplierDoc,
        payment_method: paymentMethod,
        items: purchaseItems,
        notes
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewDetails = async (pur) => {
    try {
      const res = await api.getPurchase(pur.id);
      if (res.success) {
        setViewingPurchase(res.purchase);
        setViewingItems(res.items);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const totalPurchaseAmount = purchaseItems.reduce((acc, it) => acc + it.subtotal, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary-600" />
            <span>Control de Compras a Proveedores</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de abastecimiento de mercadería con incremento automático de inventario y costo.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Registrar Compra
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">N° Compra</th>
                <th className="py-3 px-3">Proveedor</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Método</th>
                <th className="py-3 px-3 text-right">Monto Total</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Cargando compras...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No hay compras registradas.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.purchase_number}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{p.supplier_name}</td>
                    <td className="py-3 px-3 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3 uppercase text-slate-600">{p.payment_method}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {currency}{p.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(p)}
                        className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW PURCHASE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Compra a Proveedor"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre del Proveedor *</label>
              <input
                type="text"
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Ej. Distribuidora Polar C.A."
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">RUT / Documento Proveedor</label>
              <input
                type="text"
                value={supplierDoc}
                onChange={(e) => setSupplierDoc(e.target.value)}
                placeholder="J-12345678"
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Add Line Item Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-800 block">Agregar Producto a la Compra</span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-5">
                <label className="block text-slate-600 mb-0.5">Producto</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    setSelectedProduct(id);
                    const found = products.find((p) => p.id === id);
                    if (found) setItemCost(found.cost_price.toString());
                  }}
                  className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-600 mb-0.5">Costo Unit. ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemCost}
                  onChange={(e) => setItemCost(e.target.value)}
                  className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 mb-0.5">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  + Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Items Added Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2 px-3">Producto</th>
                  <th className="py-2 px-2 text-right">Costo Unit.</th>
                  <th className="py-2 px-2 text-center">Cant.</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-slate-400">
                      No hay productos añadidos a la compra.
                    </td>
                  </tr>
                ) : (
                  purchaseItems.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{it.name}</td>
                      <td className="py-2 px-2 text-right">{currency}{it.unit_cost.toFixed(2)}</td>
                      <td className="py-2 px-2 text-center font-bold">{it.quantity}</td>
                      <td className="py-2 px-3 text-right font-black text-slate-900">
                        {currency}{it.subtotal.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total & Submit */}
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-700">TOTAL COMPRA:</span>
            <span className="text-base font-black text-primary-700">
              {currency}{totalPurchaseAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={purchaseItems.length === 0}
              className="px-5 py-2 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl disabled:opacity-50"
            >
              Confirmar Compra
            </button>
          </div>
        </form>
      </Modal>

      {/* PURCHASE DETAIL MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detalle de Compra: ${viewingPurchase?.purchase_number || ''}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Proveedor:</span>
              <span className="font-bold text-slate-900">{viewingPurchase?.supplier_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha:</span>
              <span className="text-slate-800">{new Date(viewingPurchase?.created_at || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Registrado por:</span>
              <span className="text-slate-800">{viewingPurchase?.user_name || 'Admin'}</span>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-200 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-2 px-3 text-left">Producto</th>
                <th className="py-2 px-2 text-center">Cant.</th>
                <th className="py-2 px-2 text-right">Costo</th>
                <th className="py-2 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viewingItems.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3 font-semibold text-slate-800">{it.product_name}</td>
                  <td className="py-2 px-2 text-center">{it.quantity}</td>
                  <td className="py-2 px-2 text-right">{currency}{it.unit_cost.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-bold">{currency}{it.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-baseline font-black text-sm pt-2 border-t border-slate-200">
            <span>TOTAL:</span>
            <span className="text-primary-700">{currency}{viewingPurchase?.total?.toFixed(2)}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
