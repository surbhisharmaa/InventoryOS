import { useState } from 'react'
import { X, Plus, Minus, Loader2, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react'
import { stockAPI } from '../../services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TX_TYPES = [
  { value: 'IN',         label: 'Stock In',    icon: ArrowUpCircle,   color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  { value: 'OUT',        label: 'Stock Out',   icon: ArrowDownCircle, color: 'text-rose-400',    bg: 'bg-rose-500/20 border-rose-500/30' },
  { value: 'ADJUSTMENT', label: 'Set Quantity', icon: RefreshCw,      color: 'text-primary-400', bg: 'bg-primary-500/20 border-primary-500/30' },
]

export default function QuickUpdateModal({ product, onClose, onSuccess }) {
  const [txType, setTxType] = useState('IN')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (quantity <= 0) { toast.error('Quantity must be greater than 0'); return }

    setSubmitting(true)
    try {
      await stockAPI.adjust({
        product_id:       product.id,
        transaction_type: txType,
        quantity_changed: quantity,
        notes: notes || undefined,
      })
      toast.success(`Stock ${txType === 'IN' ? 'added' : txType === 'OUT' ? 'removed' : 'adjusted'} successfully!`)
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Stock update failed')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedType = TX_TYPES.find((t) => t.value === txType)

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Quick Stock Update</h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">{product.sku} — {product.name}</p>
          </div>
          <button id="close-quick-modal" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current stock indicator */}
        <div className="glass-card px-4 py-3 mb-5 flex items-center justify-between">
          <span className="text-sm text-white/60">Current Stock</span>
          <span className="text-2xl font-bold text-white">{product.quantity.toLocaleString()}</span>
        </div>

        {/* Transaction Type */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {TX_TYPES.map(({ value, label, icon: Icon, color, bg }) => (
            <button
              key={value}
              id={`tx-type-${value.toLowerCase()}`}
              type="button"
              onClick={() => setTxType(value)}
              className={clsx(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-medium',
                txType === value ? `${bg} ${color}` : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        <form id="quick-update-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity input */}
          <div>
            <label className="label">
              {txType === 'ADJUSTMENT' ? 'Set New Quantity' : 'Quantity'}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="decrement-qty"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                id="qty-input"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field text-center text-xl font-bold flex-1"
              />
              <button
                type="button"
                id="increment-qty"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <input
              id="update-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Restocked from supplier"
              className="input-field"
            />
          </div>

          {/* Preview */}
          {txType !== 'ADJUSTMENT' && (
            <div className="glass-card px-4 py-2.5 flex items-center justify-between text-sm">
              <span className="text-white/40">After update:</span>
              <span className="font-bold text-white">
                {txType === 'IN'
                  ? (product.quantity + quantity).toLocaleString()
                  : Math.max(0, product.quantity - quantity).toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" id="cancel-quick-update" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              id="submit-quick-update"
              disabled={submitting}
              className={clsx('flex-1 flex items-center justify-center gap-2 font-medium px-5 py-2.5 rounded-xl transition-all', selectedType?.bg, selectedType?.color)}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Apply Update
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
