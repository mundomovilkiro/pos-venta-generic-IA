import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Send,
  Calendar,
  AlertCircle,
  Printer,
  FileText,
  Share2,
  CheckCircle2,
  RefreshCw,
  X,
  Eye,
  Edit2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ThermalReceipt from '../components/ThermalReceipt';
import VirtualInvoiceModal from '../components/VirtualInvoiceModal';

export default function POSPage() {
  const { settings, activeShift } = useAuth();
  const currency = settings.currency_symbol || '$';

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [applyTax, setApplyTax] = useState(true);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [amountPaid, setAmountPaid] = useState('');
  const [isCredit, setIsCredit] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Post-sale modals
  const [completedSale, setCompletedSale] = useState(null);
  const [completedItems, setCompletedItems] = useState([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isVirtualModalOpen, setIsVirtualModalOpen] = useState(false);

  // Quick Customer Create Modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    document_id: '',
    phone: '',
    email: '',
    category: 'simple',
    credit_limit: 0
  });

  // Customer Debt Details Modal
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtModalData, setDebtModalData] = useState(null);
  const [debtModalLoading, setDebtModalLoading] = useState(false);

  // Helper to display clean customer name without metadata parentheses
  const getCleanCustomerName = (name) => {
    if (!name) return 'Cliente Ocasional / Mostrador';
    return name.replace(/\s*\([^)]*\)/g, '').trim() || name;
  };

  // Quick Customer Edit Modal
  const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false);
  const [quickEditCategory, setQuickEditCategory] = useState('simple');

  const handleOpenQuickEdit = () => {
    if (!selectedCustomer) return;
    setQuickEditCategory(selectedCustomer.category || 'simple');
    setIsQuickEditModalOpen(true);
  };

  const handleSaveQuickEdit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      await api.updateCustomer(selectedCustomer.id, {
        name: selectedCustomer.name,
        document_id: selectedCustomer.document_id || '',
        phone: selectedCustomer.phone || '',
        email: selectedCustomer.email || '',
        address: selectedCustomer.address || '',
        category: quickEditCategory,
        credit_limit: selectedCustomer.credit_limit || 0
      });

      const updatedCust = { ...selectedCustomer, category: quickEditCategory };
      setSelectedCustomer(updatedCust);
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? updatedCust : c))
      );
      setIsQuickEditModalOpen(false);
    } catch (err) {
      alert(err.message || 'Error al actualizar categoría del cliente');
    }
  };

  const handleOpenDebtModal = async () => {
    if (!selectedCustomer) return;
    setIsDebtModalOpen(true);
    setDebtModalLoading(true);
    try {
      const res = await api.getDebtorDetails(selectedCustomer.id);
      if (res.success) {
        setDebtModalData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDebtModalLoading(false);
    }
  };

  const searchInputRef = useRef(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, custRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getCustomers()
      ]);
      if (prodRes.success) setProducts(prodRes.products);
      if (catRes.success) setCategories(catRes.categories);
      if (custRes.success) setCustomers(custRes.customers);
    } catch (err) {
      console.error('Error cargando catálogo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Autofocus barcode search input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, [completedSale]);

  // Recalculate item unit prices if customer category changes
  useEffect(() => {
    if (cart.length === 0) return;
    const cat = selectedCustomer?.category || 'simple';

    setCart((prevCart) =>
      prevCart.map((item) => {
        let newPrice = item.price_regular;
        if (cat === 'mayorista' && item.price_wholesale > 0) {
          newPrice = item.price_wholesale;
        } else if (cat === 'frecuente' && item.price_frequent > 0) {
          newPrice = item.price_frequent;
        }
        return {
          ...item,
          appliedPrice: newPrice,
          subtotal: newPrice * item.quantity - (item.discount || 0)
        };
      })
    );
  }, [selectedCustomer]);

  // Add product to cart by object or barcode
  const addToCart = (product) => {
    if (product.stock <= 0) {
      setErrorMsg(`"${product.name}" no tiene stock disponible.`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const customerCat = selectedCustomer?.category || 'simple';
    let unitPrice = product.price_regular;
    if (customerCat === 'mayorista' && product.price_wholesale > 0) {
      unitPrice = product.price_wholesale;
    } else if (customerCat === 'frecuente' && product.price_frequent > 0) {
      unitPrice = product.price_frequent;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((it) => it.id === product.id);
      if (existingIndex > -1) {
        const item = prevCart[existingIndex];
        if (item.quantity + 1 > product.stock) {
          setErrorMsg(`Stock máximo alcanzado para ${product.name} (${product.stock} disponibles).`);
          setTimeout(() => setErrorMsg(''), 3000);
          return prevCart;
        }
        const updated = [...prevCart];
        const newQty = item.quantity + 1;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          subtotal: item.appliedPrice * newQty - (item.discount || 0)
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            ...product,
            appliedPrice: unitPrice,
            quantity: 1,
            discount: 0,
            subtotal: unitPrice
          }
        ];
      }
    });

    setSearchQuery('');
  };

  // Barcode / Enter key search handler
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      e.preventDefault();
      const code = searchQuery.trim().toLowerCase();
      // Look for exact barcode match first
      const exactBarcode = products.find(
        (p) => p.barcode && p.barcode.toLowerCase() === code
      );
      if (exactBarcode) {
        addToCart(exactBarcode);
        return;
      }
      // Look for partial name match
      const matched = products.find(
        (p) => p.name.toLowerCase().includes(code)
      );
      if (matched) {
        addToCart(matched);
      } else {
        setErrorMsg(`No se encontró producto con código o nombre "${searchQuery}".`);
        setTimeout(() => setErrorMsg(''), 3000);
      }
    }
  };

  // Update quantity
  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((it) => {
          if (it.id === id) {
            const newQty = it.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > it.stock) {
              setErrorMsg(`Solo hay ${it.stock} unidades disponibles.`);
              setTimeout(() => setErrorMsg(''), 3000);
              return it;
            }
            return {
              ...it,
              quantity: newQty,
              subtotal: it.appliedPrice * newQty - (it.discount || 0)
            };
          }
          return it;
        })
        .filter(Boolean)
    );
  };

  // Remove item
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((it) => it.id !== id));
  };

  // Calculate Cart Financials
  const cartSubtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
  const taxRate = applyTax ? parseFloat(settings.tax_rate) || 0 : 0;
  const taxableAmount = Math.max(0, cartSubtotal - (parseFloat(discountAmount) || 0));
  const taxAmount = (taxableAmount * taxRate) / 100;
  const cartTotal = taxableAmount + taxAmount;

  // Change / Vuelto
  const numericPaid = parseFloat(amountPaid) || 0;
  const changeGiven = paymentMethod === 'efectivo' && !isCredit && numericPaid > cartTotal
    ? numericPaid - cartTotal
    : 0;

  // Credit debt preview
  const creditDebtBalance = isCredit ? Math.max(0, cartTotal - numericPaid) : 0;

  // Fast cash denomination buttons
  const setExactCash = () => setAmountPaid(cartTotal.toFixed(2));
  const addCash = (val) => setAmountPaid(val.toString());

  // Handle Complete Sale
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (isCredit && !selectedCustomer) {
      setErrorMsg('Para una venta al crédito es obligatorio seleccionar un cliente registrado.');
      return;
    }

    if (isCredit && selectedCustomer?.credit_limit > 0) {
      const projected = (selectedCustomer.current_debt || 0) + creditDebtBalance;
      if (projected > selectedCustomer.credit_limit) {
        setErrorMsg(`Límite de crédito excedido. Límite: $${selectedCustomer.credit_limit.toFixed(2)}, Deuda proyectada: $${projected.toFixed(2)}`);
        return;
      }
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      const salePayload = {
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        items: cart.map((it) => ({
          product_id: it.id,
          unit_price: it.appliedPrice,
          quantity: it.quantity,
          discount: it.discount || 0
        })),
        payment_method: isCredit ? 'credito' : paymentMethod,
        amount_paid: numericPaid,
        tax_rate: taxRate,
        discount_amount: parseFloat(discountAmount) || 0,
        is_credit: isCredit,
        due_date: isCredit ? dueDate : null,
        notes: saleNotes
      };

      const res = await api.createSale(salePayload);
      if (res.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Fetch full sale for receipt rendering
        const fullSaleRes = await api.getSale(res.saleId);
        if (fullSaleRes.success) {
          setCompletedSale(fullSaleRes.sale);
          setCompletedItems(fullSaleRes.items);
          setIsReceiptModalOpen(true);
        }

        // Reset cart
        setCart([]);
        setSelectedCustomer(null);
        setAmountPaid('');
        setIsCredit(false);
        setDueDate('');
        setSaleNotes('');
        setDiscountAmount(0);

        // Refresh product stock and customer list
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la venta.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Customer Create Handler
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createCustomer(newCustomerData);
      if (res.success) {
        const custRes = await api.getCustomers();
        if (custRes.success) {
          setCustomers(custRes.customers);
          const created = custRes.customers.find((c) => c.id === res.customerId);
          if (created) setSelectedCustomer(created);
        }
        setIsNewCustomerModalOpen(false);
        setNewCustomerData({
          name: '',
          document_id: '',
          phone: '',
          email: '',
          category: 'simple',
          credit_limit: 0
        });
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'all' || p.category_id === parseInt(selectedCategory, 10);
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Drawer warning alert if closed */}
      {!activeShift && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Aviso de Caja:</strong> No hay un turno de caja abierto actualmente. Las ventas se registrarán, pero se recomienda abrir turno para llevar el arqueo de efectivo.
            </span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-700 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Products Catalog & Search (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search bar & Category filter */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Escanear código de barra o buscar producto por nombre (Presiona Enter)..."
                className="w-full pl-11 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium"
              />
              <Barcode className="w-5 h-5 text-slate-400 absolute right-3.5 top-3" />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos los Productos
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id.toString())}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                    selectedCategory === c.id.toString()
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 min-h-[480px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                <span className="text-xs">Cargando catálogo...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Search className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm font-semibold">No se encontraron productos</p>
                <p className="text-xs text-slate-400 mt-1">Prueba con otro término de búsqueda o categoría.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((p) => {
                  const custCat = selectedCustomer?.category || 'simple';
                  let activePrice = p.price_regular;
                  if (custCat === 'mayorista' && p.price_wholesale > 0) {
                    activePrice = p.price_wholesale;
                  } else if (custCat === 'frecuente' && p.price_frequent > 0) {
                    activePrice = p.price_frequent;
                  }

                  const isLow = p.stock <= p.min_stock && p.stock > 0;
                  const isOut = p.stock <= 0;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isOut}
                      onClick={() => addToCart(p)}
                      className={`text-left p-3.5 rounded-2xl border transition-all duration-150 flex flex-col justify-between group relative ${
                        isOut
                          ? 'opacity-40 bg-slate-50/80 border-slate-200 cursor-not-allowed'
                          : 'bg-white border-slate-200/80 hover:border-slate-400 hover:shadow-sm active:scale-[0.98] cursor-pointer'
                      }`}
                    >
                      <div>
                        {/* Category & Stock pill */}
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                            {p.category_name || 'General'}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                              isOut
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                : isLow
                                ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isOut ? 'Agotado' : `${p.stock} ${p.unit}`}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">
                          {p.name}
                        </h4>
                        {p.barcode && (
                          <span className="text-[10px] font-mono text-slate-400 block mt-1">
                            {p.barcode}
                          </span>
                        )}
                      </div>

                      {/* Pricing Tier Display */}
                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-base font-black font-mono text-slate-900 group-hover:text-primary-700 tracking-tight">
                          {currency}{activePrice.toFixed(2)}
                        </span>

                        {custCat !== 'simple' && (
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${
                            custCat === 'mayorista'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200/70'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                          }`}>
                            {custCat}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Cart & Checkout (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            {/* Cart Header & Customer Selector */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Orden de Venta</span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-primary-100 text-primary-800 rounded-full">
                    {cart.reduce((a, b) => a + b.quantity, 0)} ítems
                  </span>
                </h3>

                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Vaciar Carrito
                  </button>
                )}
              </div>

              {/* Customer Selector with Category Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cliente</span>
                  </label>
                  {!selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => setIsNewCustomerModalOpen(true)}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      + Nuevo Cliente
                    </button>
                  )}
                </div>

                {!selectedCustomer ? (
                  /* Dropdown showing ONLY the clean customer name */
                  <select
                    value=""
                    onChange={(e) => {
                      const id = parseInt(e.target.value, 10);
                      const cust = customers.find((c) => c.id === id);
                      setSelectedCustomer(cust || null);
                    }}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 font-medium text-slate-800"
                  >
                    <option value="">Cliente Ocasional / Mostrador</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getCleanCustomerName(c.name)}
                      </option>
                    ))}
                  </select>
                ) : (
                  /* Fixed Customer Card when selected */
                  <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-2.5">
                    {/* Fixed Customer Header & Change Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                          <User className="w-4 h-4 text-sky-400" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest leading-none">
                            Cliente Seleccionado
                          </span>
                          <h4 className="text-xs font-black text-slate-900 truncate mt-1 tracking-tight">
                            {getCleanCustomerName(selectedCustomer.name)}
                          </h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="text-[11px] font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center gap-1 flex-shrink-0"
                        title="Cambiar o deseleccionar cliente"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cambiar</span>
                      </button>
                    </div>

                    {/* Fixed Category Display & Quick Edit Option */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50/80 border border-slate-200/70 rounded-xl">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          Categoría Fija del Cliente:
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              selectedCustomer.category === 'mayorista'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                                : selectedCustomer.category === 'frecuente'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                            }`}
                          >
                            {selectedCustomer.category || 'simple'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {selectedCustomer.category === 'mayorista'
                              ? '• Tarifa mayorista'
                              : selectedCustomer.category === 'frecuente'
                              ? '• Tarifa frecuente'
                              : '• Tarifa regular'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenQuickEdit}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-2xs active:scale-95"
                        title="Modificar categoría del cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Editar</span>
                      </button>
                    </div>

                    {/* Button to view Debt */}
                    <button
                      type="button"
                      onClick={handleOpenDebtModal}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border active:scale-[0.98] ${
                        selectedCustomer.current_debt > 0
                          ? 'bg-rose-50/80 text-rose-800 border-rose-200/70 hover:bg-rose-100/70'
                          : 'bg-emerald-50/80 text-emerald-800 border-emerald-200/70 hover:bg-emerald-100/70'
                      }`}
                      title="Ver detalle de deuda y cuentas pendientes"
                    >
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>
                          {selectedCustomer.current_debt > 0 ? 'Deuda Acumulada:' : 'Estado de Cuenta:'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black font-mono">
                          {selectedCustomer.current_debt > 0
                            ? `${currency}${selectedCustomer.current_debt.toFixed(2)}`
                            : 'Al Día ($0.00)'}
                        </span>
                        <span className="text-[10px] underline ml-1">Ver Deuda &rsaquo;</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-2">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-xs">El carrito está vacío</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Selecciona productos del catálogo o escanea con lector.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="p-2 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate">{item.name}</h5>
                      <span className="text-[11px] text-slate-500">
                        {currency}{item.appliedPrice.toFixed(2)} c/u
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-transform"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-transform"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="text-right w-16">
                      <span className="text-xs font-black text-slate-900 block">
                        {currency}{item.subtotal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Financial Summary */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-800">{currency}{cartSubtotal.toFixed(2)}</span>
              </div>

              {/* Tax toggle */}
              <div className="flex justify-between items-center text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyTax}
                    onChange={(e) => setApplyTax(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500 border-slate-300"
                  />
                  <span>Aplicar IVA ({settings.tax_rate || 0}%):</span>
                </label>
                <span className="font-mono font-bold text-slate-800">{currency}{taxAmount.toFixed(2)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex justify-between items-center text-slate-600">
                <span>Descuento global ({currency}):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-3 border-t border-slate-200/80 text-sm font-black text-slate-900">
                <span className="tracking-tight uppercase text-xs text-slate-500">Total a Pagar</span>
                <span className="text-2xl font-mono font-black text-slate-900 tracking-tight">{currency}{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Options & Checkout Form */}
            <form onSubmit={handleCheckout} className="p-4 bg-white border-t border-slate-200/80 space-y-4">
              {/* Payment Method Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Forma de Pago
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'efectivo', label: 'Efectivo', icon: Banknote },
                    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                    { id: 'transferencia', label: 'Transfer.', icon: Send },
                    { id: 'credito', label: 'Crédito', icon: Calendar, highlight: true }
                  ].map((pm) => {
                    const Icon = pm.icon;
                    const isSelected = isCredit ? pm.id === 'credito' : paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => {
                          if (pm.id === 'credito') {
                            setIsCredit(true);
                            setPaymentMethod('credito');
                          } else {
                            setIsCredit(false);
                            setPaymentMethod(pm.id);
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-[11px] font-bold border transition-all duration-150 active:scale-95 ${
                          isSelected
                            ? pm.highlight
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Payment Details */}
              {isCredit ? (
                /* CREDIT / FIADO SALE SECTION */
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Venta al Crédito / Cuentas por Cobrar (Deudor)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Abono Inicial ({currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="0.00 (Opcional)"
                        className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Fecha Vencimiento
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-bold pt-2 border-t border-amber-200/60">
                    <span className="text-amber-900">Saldo a Deuda Pendiente:</span>
                    <span className="text-rose-600 font-mono font-black text-sm">
                      {currency}{creditDebtBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : paymentMethod === 'efectivo' ? (
                /* CASH PAYMENT & CHANGE SECTION */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Monto Recibido ({currency})
                    </label>
                    {/* Quick exact cash button */}
                    <button
                      type="button"
                      onClick={setExactCash}
                      className="text-[11px] font-bold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Monto Exacto
                    </button>
                  </div>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={cartTotal > 0 ? cartTotal.toFixed(2) : '0.00'}
                    className="w-full py-2.5 px-3 text-base font-mono font-bold bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
                  />

                  {/* Denomination buttons */}
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 20, 50, 100].map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => addCash(bill)}
                        className="flex-1 py-1.5 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200/90 active:scale-95 rounded-lg text-slate-800 transition-all border border-slate-200/60"
                      >
                        +{bill}
                      </button>
                    ))}
                  </div>

                  {/* Change Preview */}
                  {numericPaid > cartTotal && (
                    <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                      <span className="font-bold text-emerald-800">Cambio / Vuelto al cliente:</span>
                      <span className="font-mono font-black text-base text-emerald-700">
                        {currency}{changeGiven.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Submit Sale Button */}
              <button
                type="submit"
                disabled={cart.length === 0 || submitting}
                className="w-full py-3.5 px-4 rounded-xl font-black text-sm text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{submitting ? 'Procesando Venta...' : `Cobrar ${currency}${cartTotal.toFixed(2)}`}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* POST-SALE COMPLETION MODAL */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title={`Venta Exitosa: ${completedSale?.invoice_number || ''}`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-sm block text-emerald-900">¡Venta completada con éxito!</span>
              Total procesado: {currency}{completedSale?.total?.toFixed(2)} | Método: {completedSale?.payment_method?.toUpperCase()}
            </div>
          </div>

          {/* Thermal Receipt Component */}
          <ThermalReceipt
            sale={completedSale}
            items={completedItems}
            settings={settings}
            onOpenVirtual={() => {
              setIsReceiptModalOpen(false);
              setIsVirtualModalOpen(true);
            }}
          />

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(false)}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              Cerrar y Nueva Venta
            </button>
          </div>
        </div>
      </Modal>

      {/* VIRTUAL INVOICE MODAL */}
      <VirtualInvoiceModal
        isOpen={isVirtualModalOpen}
        onClose={() => setIsVirtualModalOpen(false)}
        sale={completedSale}
        items={completedItems}
        settings={settings}
        onPrintThermal={() => {
          setIsVirtualModalOpen(false);
          setIsReceiptModalOpen(true);
        }}
      />

      {/* QUICK CUSTOMER CREATE MODAL */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="Registrar Nuevo Cliente"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              value={newCustomerData.name}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              placeholder="Ej. Distribuidora Central o Juan Pérez"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Documento / DNI / RFC</label>
              <input
                type="text"
                value={newCustomerData.document_id}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, document_id: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                placeholder="V-12345678"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
              <input
                type="text"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                placeholder="+1 555-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoría de Cliente</label>
              <select
                value={newCustomerData.category}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, category: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-semibold"
              >
                <option value="simple">Simple (Precio Regular)</option>
                <option value="frecuente">Frecuente (Precio Preferencial)</option>
                <option value="mayorista">Mayorista (Precio al Por Mayor)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Límite Crédito ({currency})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newCustomerData.credit_limit}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, credit_limit: parseFloat(e.target.value) || 0 })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
                placeholder="0 = Sin límite"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsNewCustomerModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl"
            >
              Guardar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* DEBT DETAILS QUICK MODAL */}
      <Modal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        title={`Detalle de Cuenta: ${getCleanCustomerName(selectedCustomer?.name)}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Deuda Total Pendiente:</span>
              <span className={`text-base font-black ${selectedCustomer?.current_debt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {currency}{(selectedCustomer?.current_debt || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Límite de Crédito:</span>
              <span className="font-semibold">
                {selectedCustomer?.credit_limit > 0 ? `${currency}${selectedCustomer.credit_limit.toFixed(2)}` : 'Sin límite'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Categoría Asignada:</span>
              <span className="font-bold uppercase text-primary-700">
                {selectedCustomer?.category || 'simple'}
              </span>
            </div>
          </div>

          {/* Pending Sales List */}
          <div>
            <h4 className="font-bold text-slate-800 mb-2">Facturas al Crédito Pendientes</h4>
            {debtModalLoading ? (
              <div className="py-6 text-center text-slate-400">Cargando cuentas...</div>
            ) : !debtModalData?.pendingSales || debtModalData.pendingSales.length === 0 ? (
              <div className="py-4 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                Este cliente no tiene facturas pendientes de pago.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                {debtModalData.pendingSales.map((s) => (
                  <div key={s.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{s.invoice_number}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(s.created_at).toLocaleDateString()} {s.due_date ? `• Vence: ${s.due_date}` : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-red-600 block">{currency}{s.debt_balance.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400">Orig: {currency}{s.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsDebtModalOpen(false)}
              className="px-4 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* QUICK CUSTOMER EDIT MODAL */}
      <Modal
        isOpen={isQuickEditModalOpen}
        onClose={() => setIsQuickEditModalOpen(false)}
        title={`Editar Rápido: ${getCleanCustomerName(selectedCustomer?.name)}`}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSaveQuickEdit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Categoría del Cliente *</label>
            <select
              value={quickEditCategory}
              onChange={(e) => setQuickEditCategory(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
            >
              <option value="simple">Simple (Tarifa estándar de mostrador)</option>
              <option value="frecuente">Frecuente (Tarifa preferencial)</option>
              <option value="mayorista">Mayorista (Tarifa al por mayor)</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Al guardar, se actualizará la categoría oficial del cliente y se recalcularán los precios de los productos en la orden.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsQuickEditModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
