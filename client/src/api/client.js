const API_BASE = '/api';

export function getStoredToken() {
  return localStorage.getItem('pos_token') || null;
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('pos_token', token);
  } else {
    localStorage.removeItem('pos_token');
  }
}

export function getStoredUser() {
  const user = localStorage.getItem('pos_user');
  return user ? JSON.parse(user) : null;
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('pos_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('pos_user');
  }
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        // If unauthorized token expired
        if (token && endpoint !== '/auth/login') {
          setStoredToken(null);
          setStoredUser(null);
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      }
      throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/auth/me'),
  getUsers: () => request('/auth/users'),
  createUser: (userData) => request('/auth/users', { method: 'POST', body: JSON.stringify(userData) }),

  // Products & Inventory
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getProductAlerts: () => request('/products/alerts'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  adjustStock: (id, data) => request(`/products/${id}/adjust`, { method: 'POST', body: JSON.stringify(data) }),
  getCategories: () => request('/products/categories/all'),
  createCategory: (data) => request('/products/categories/all', { method: 'POST', body: JSON.stringify(data) }),

  // Customers
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/customers${query ? `?${query}` : ''}`);
  },
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Sales
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sales${query ? `?${query}` : ''}`);
  },
  getSale: (id) => request(`/sales/${id}`),
  getVirtualInvoice: (invoiceNumber) => request(`/sales/invoice/${invoiceNumber}`),
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),

  // Debtors & Abonos
  getDebtors: () => request('/debtors'),
  getDebtorDetails: (customerId) => request(`/debtors/${customerId}`),
  registerAbono: (data) => request('/debtors/abono', { method: 'POST', body: JSON.stringify(data) }),
  getAbonoReceipt: (receiptNumber) => request(`/debtors/receipt/${receiptNumber}`),

  // Purchases
  getPurchases: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/purchases${query ? `?${query}` : ''}`);
  },
  getPurchase: (id) => request(`/purchases/${id}`),
  createPurchase: (data) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),

  // Expenses
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/expenses${query ? `?${query}` : ''}`);
  },
  createExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Cash Shifts (Arqueo de caja)
  getCurrentShift: () => request('/cash/current'),
  openShift: (data) => request('/cash/open', { method: 'POST', body: JSON.stringify(data) }),
  closeShift: (data) => request('/cash/close', { method: 'POST', body: JSON.stringify(data) }),
  getShiftHistory: () => request('/cash/history'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats')
};

export default api;
