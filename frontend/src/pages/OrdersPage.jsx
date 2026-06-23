import { useEffect, useState } from 'react'
import { ordersAPI, customersAPI, productsAPI } from '../services/api'
import { Plus, Trash2, ChevronDown, ChevronUp, ShoppingCart, Package, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import CustomSelect from '../components/ui/CustomSelect'

const STATUS_STYLES = {
  CONFIRMED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  PENDING:   'bg-amber-500/20  text-amber-400  border border-amber-500/30',
  CANCELLED: 'bg-rose-500/20   text-rose-400   border border-rose-500/30',
}

/* ── Create Order Modal ───────────────────────────────────────────────────── */
function CreateOrderModal({ onClose, onSuccess }) {
  const [customers, setCustomers] = useState([])
  const [products,  setProducts]  = useState([])
  const [customerId, setCustomerId] = useState('')
  const [lines, setLines] = useState([{ product_id: '', quantity: 1 }])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [loadingForm, setLoadingForm] = useState(true)

  useEffect(() => {
    Promise.all([
      customersAPI.list(),
      productsAPI.list({ page_size: 200 }),
    ]).then(([cRes, pRes]) => {
        setCustomers(cRes.data.items ?? [])
        setProducts((pRes.data.items ?? []).filter(p => p.quantity > 0))
      }
    ).catch((err) => {
      const detail = err?.response?.data?.detail || err?.message || 'Unknown error'
      toast.error(`Failed to load form data: ${detail}`)
    }).finally(() => setLoadingForm(false))
  }, [])

  const addLine    = () => setLines(l => [...l, { product_id: '', quantity: 1 }])
  const removeLine = (i) => setLines(l => l.filter((_, idx) => idx !== i))
  const updateLine = (i, field, val) => setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [field]: val } : ln))

  const selectedProduct = (pid) => products.find(p => p.id === pid)

  const computeTotal = () =>
    lines.reduce((sum, ln) => {
      const p = selectedProduct(ln.product_id)
      return sum + (p ? p.selling_price * (parseInt(ln.quantity) || 0) : 0)
    }, 0).toFixed(2)

  const validate = () => {
    const e = {}
    if (!customerId) e.customer = 'Please select a customer'
    lines.forEach((ln, i) => {
      if (!ln.product_id) e[`product_${i}`] = 'Select a product'
      const p = selectedProduct(ln.product_id)
      if (p && parseInt(ln.quantity) > p.quantity)
        e[`qty_${i}`] = `Max available: ${p.quantity}`
      if (parseInt(ln.quantity) < 1) e[`qty_${i}`] = 'Quantity must be ≥ 1'
    })
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      await ordersAPI.create({
        customer_id: customerId,
        items: lines.map(ln => ({ product_id: ln.product_id, quantity: parseInt(ln.quantity) })),
        notes: notes || undefined,
      })
      toast.success('Order created successfully!')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-xl w-full animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Create Order</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Customer */}
          <div>
            <label className="label">Customer *</label>
          <CustomSelect
            id="order-customer"
            value={customerId}
            onChange={(e) => { setCustomerId(e.target.value); setErrors(er => ({ ...er, customer: undefined })) }}
            placeholder={loadingForm ? 'Loading customers…' : '— Select customer —'}
            options={customers.map(c => ({ value: c.id, label: `${c.full_name} (${c.email})` }))}
            className={errors.customer ? 'ring-1 ring-accent-rose/60 rounded-xl' : ''}
            disabled={loadingForm}
          />
            {errors.customer && <p className="text-xs text-accent-rose mt-1">{errors.customer}</p>}
          </div>

          {/* Order Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Products *</label>
              <button type="button" onClick={addLine} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add line
              </button>
            </div>
            <div className="space-y-3">
              {lines.map((ln, i) => {
                const prod = selectedProduct(ln.product_id)
                return (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 min-w-0">
                      <CustomSelect
                        id={`order-product-${i}`}
                        value={ln.product_id}
                        onChange={(e) => { updateLine(i, 'product_id', e.target.value); setErrors(er => ({ ...er, [`product_${i}`]: undefined })) }}
                        placeholder={loadingForm ? 'Loading products…' : '— Select product —'}
                        options={products.map(p => ({
                          value: p.id,
                          label: `${p.name} (${p.sku}) — $${p.selling_price} | Stock: ${p.quantity}`,
                        }))}
                        className={errors[`product_${i}`] ? 'ring-1 ring-accent-rose/60 rounded-xl' : ''}
                        disabled={loadingForm}
                      />
                      {errors[`product_${i}`] && <p className="text-xs text-accent-rose mt-0.5">{errors[`product_${i}`]}</p>}
                    </div>
                    <div className="w-24 flex-shrink-0">
                      <input
                        id={`order-qty-${i}`}
                        type="number"
                        min={1}
                        max={prod?.quantity || 9999}
                        value={ln.quantity}
                        onChange={(e) => { updateLine(i, 'quantity', e.target.value); setErrors(er => ({ ...er, [`qty_${i}`]: undefined })) }}
                        className={`input-field text-center ${errors[`qty_${i}`] ? 'border-accent-rose/60' : ''}`}
                        placeholder="Qty"
                      />
                      {errors[`qty_${i}`] && <p className="text-xs text-accent-rose mt-0.5">{errors[`qty_${i}`]}</p>}
                    </div>
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(i)} className="mt-3 text-white/20 hover:text-accent-rose transition-colors flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions…"
              rows={2}
              className="input-field resize-none"
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-sm text-white/60">Estimated Total</span>
            <span className="text-lg font-bold text-white">${computeTotal()}</span>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Creating…' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Order Row with expandable details ───────────────────────────────────── */
function OrderRow({ order, isAdmin, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="table-row cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="table-cell">
          <span className="font-mono text-xs text-white/40">#{order.id.slice(0, 8)}…</span>
        </td>
        <td className="table-cell font-medium text-white">{order.customer_name || '—'}</td>
        <td className="table-cell hidden sm:table-cell text-white/60 text-xs">{order.customer_email}</td>
        <td className="table-cell">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status] || ''}`}>
            {order.status}
          </span>
        </td>
        <td className="table-cell font-semibold text-white">${parseFloat(order.total_amount).toFixed(2)}</td>
        <td className="table-cell hidden md:table-cell text-white/40 text-xs">
          {new Date(order.created_at).toLocaleDateString()}
        </td>
        <td className="table-cell text-right">
          <div className="flex items-center justify-end gap-1">
            {isAdmin && order.status !== 'CANCELLED' && (
              <button
                id={`cancel-order-${order.id}`}
                onClick={(e) => { e.stopPropagation(); onDelete(order) }}
                className="p-1.5 rounded-lg text-white/20 hover:text-accent-rose hover:bg-accent-rose/10 transition-all"
                title="Cancel order"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-white/3">
          <td colSpan={7} className="px-6 py-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Order Items</p>
              {order.items.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                      <Package className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.product_name}</p>
                      <p className="text-xs text-white/30">SKU: {item.product_sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}</p>
                    <p className="text-xs text-white/40">= ${parseFloat(item.subtotal).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {order.notes && (
                <p className="text-xs text-white/40 mt-2 italic">Note: {order.notes}</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ── Orders Page ─────────────────────────────────────────────────────────── */
export default function OrdersPage() {
  const { isAdmin } = useAuth()
  const [orders, setOrders] = useState([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data } = await ordersAPI.list()
      setOrders(data.items)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const handleDelete = async (order) => {
    if (!window.confirm(`Cancel order #${order.id.slice(0, 8)}? Stock will be restored.`)) return
    try {
      await ordersAPI.delete(order.id)
      toast.success('Order cancelled. Stock restored.')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel order')
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/30">{total} order{total !== 1 ? 's' : ''} total</span>
        <button
          id="create-order-btn"
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-white/5">
            <tr>
              <th className="table-header text-left">Order ID</th>
              <th className="table-header text-left">Customer</th>
              <th className="table-header text-left hidden sm:table-cell">Email</th>
              <th className="table-header text-left">Status</th>
              <th className="table-header text-left">Total</th>
              <th className="table-header text-left hidden md:table-cell">Date</th>
              <th className="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="table-cell">
                      <div className="h-4 rounded shimmer bg-white/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-cell text-center text-white/30 py-12">
                  No orders yet. Create one to get started.
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <OrderRow
                  key={order.id}
                  order={order}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchOrders() }}
        />
      )}
    </div>
  )
}
