import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor — attach JWT from localStorage ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor — handle 401 by redirecting to login ──────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authAPI = {
  login:         (data) => api.post('/auth/login', data),
  register:      (data) => api.post('/auth/register', data),
  passwordReset: (data) => api.post('/auth/password-reset', data),
  me:            ()     => api.get('/auth/me'),
}

// ── Products endpoints ────────────────────────────────────────────────────────
export const productsAPI = {
  list:   (params) => api.get('/products', { params }),
  get:    (id)     => api.get(`/products/${id}`),
  create: (data)   => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id)     => api.delete(`/products/${id}`),
}

// ── Suppliers endpoints ───────────────────────────────────────────────────────
export const suppliersAPI = {
  list:   (params) => api.get('/suppliers', { params }),
  get:    (id)     => api.get(`/suppliers/${id}`),
  create: (data)   => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id)     => api.delete(`/suppliers/${id}`),
}

// ── Stock endpoints ────────────────────────────────────────────────────────────
export const stockAPI = {
  adjust:          (data)   => api.post('/stock/adjust', data),
  listTransactions:(params) => api.get('/stock/transactions', { params }),
  getLowStock:     ()       => api.get('/stock/low-stock'),
  checkAlerts:     ()       => api.post('/stock/check-alerts'),
  listPurchaseOrders: (params) => api.get('/stock/purchase-orders', { params }),
}

// ── Analytics endpoints ───────────────────────────────────────────────────────
export const analyticsAPI = {
  dashboard:       () => api.get('/analytics/dashboard'),
  stockByCategory: () => api.get('/analytics/stock-by-category'),
  transactionHistory: () => api.get('/analytics/transaction-history'),
}

// ── Customers endpoints ───────────────────────────────────────────────────────
export const customersAPI = {
  list:   ()           => api.get('/customers'),
  get:    (id)         => api.get(`/customers/${id}`),
  create: (data)       => api.post('/customers', data),
  delete: (id)         => api.delete(`/customers/${id}`),
}

// ── Orders endpoints ──────────────────────────────────────────────────────────
export const ordersAPI = {
  list:   ()     => api.get('/orders'),
  get:    (id)   => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  delete: (id)   => api.delete(`/orders/${id}`),
}

export default api
