import { useEffect, useState } from 'react'
import { customersAPI } from '../services/api'
import { Plus, Trash2, User, Mail, Phone, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function AddCustomerModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      await customersAPI.create(form)
      toast.success('Customer added successfully!')
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add customer'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-md w-full animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-cyan/20 flex items-center justify-center">
              <User className="w-5 h-5 text-accent-cyan" />
            </div>
            <h2 className="text-lg font-semibold text-white">Add Customer</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="label">Full Name *</label>
            <input
              id="customer-full-name"
              type="text"
              value={form.full_name}
              onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="e.g. Alice Thompson"
              className={`input-field ${errors.full_name ? 'border-accent-rose/60' : ''}`}
            />
            {errors.full_name && <p className="text-xs text-accent-rose mt-1">{errors.full_name}</p>}
          </div>

          <div>
            <label className="label">Email Address *</label>
            <input
              id="customer-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="alice@example.com"
              className={`input-field ${errors.email ? 'border-accent-rose/60' : ''}`}
            />
            {errors.email && <p className="text-xs text-accent-rose mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              id="customer-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+1-555-0100"
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding…' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const { isAdmin } = useAuth()
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data } = await customersAPI.list()
      setCustomers(data.items)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [])

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete customer "${customer.full_name}"? This cannot be undone.`)) return
    try {
      await customersAPI.delete(customer.id)
      toast.success('Customer deleted')
      fetchCustomers()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete customer'
      toast.error(msg)
    }
  }

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              id="customer-search"
              type="text"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white
                         placeholder-white/30 focus:outline-none focus:border-primary-500 w-72 transition-all"
            />
          </div>
          <span className="text-xs text-white/30 hidden sm:block">
            {total} customer{total !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          id="add-customer-btn"
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-white/5">
            <tr>
              <th className="table-header text-left">Name</th>
              <th className="table-header text-left hidden sm:table-cell">Email</th>
              <th className="table-header text-left hidden md:table-cell">Phone</th>
              <th className="table-header text-left hidden lg:table-cell">Joined</th>
              {isAdmin && <th className="table-header text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="table-cell">
                      <div className="h-4 rounded shimmer bg-white/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-cell text-center text-white/30 py-12">
                  {search ? 'No customers match your search.' : 'No customers yet. Add one to get started.'}
                </td>
              </tr>
            ) : (
              filtered.map((customer) => (
                <tr key={customer.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-accent-cyan/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-accent-cyan">
                          {customer.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-white">{customer.full_name}</span>
                    </div>
                  </td>
                  <td className="table-cell hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-white/60">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      {customer.email}
                    </div>
                  </td>
                  <td className="table-cell hidden md:table-cell">
                    {customer.phone ? (
                      <div className="flex items-center gap-1.5 text-white/60">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        {customer.phone}
                      </div>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="table-cell hidden lg:table-cell text-white/40 text-xs">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="table-cell text-right">
                      <button
                        id={`delete-customer-${customer.id}`}
                        onClick={() => handleDelete(customer)}
                        className="p-1.5 rounded-lg text-white/20 hover:text-accent-rose hover:bg-accent-rose/10 transition-all"
                        title="Delete customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchCustomers() }}
        />
      )}
    </div>
  )
}
