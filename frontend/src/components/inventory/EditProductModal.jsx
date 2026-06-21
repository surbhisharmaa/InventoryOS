import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Loader2 } from 'lucide-react'
import { productsAPI, suppliersAPI } from '../../services/api'
import toast from 'react-hot-toast'

const CATEGORIES = ['Electronics', 'Furniture', 'Stationery', 'Tools', 'Clothing', 'Food & Beverage', 'Other']

export default function EditProductModal({ product, onClose, onSuccess }) {
  const [suppliers, setSuppliers] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name:          product.name,
      description:   product.description || '',
      category:      product.category,
      reorder_point: product.reorder_point,
      cost_price:    Number(product.cost_price),
      selling_price: Number(product.selling_price),
      supplier_id:   product.supplier_id || '',
    },
  })

  useEffect(() => {
    suppliersAPI.list({ active_only: true })
      .then(({ data }) => setSuppliers(data))
      .catch(() => {})
  }, [])

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        reorder_point: parseInt(data.reorder_point),
        cost_price:    parseFloat(data.cost_price),
        selling_price: parseFloat(data.selling_price),
        supplier_id:   data.supplier_id || null,
      }
      await productsAPI.update(product.id, payload)
      toast.success('Product updated successfully!')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Product</h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">{product.sku}</p>
          </div>
          <button id="close-edit-modal" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="edit-product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Product Name *</label>
            <input {...register('name', { required: 'Name is required' })}
              className={`input-field ${errors.name ? 'border-rose-500/60' : ''}`} />
            {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={2}
              className="input-field resize-none" />
          </div>

          <div>
            <label className="label">Category *</label>
            <select {...register('category', { required: true })} className="input-field">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Reorder Point *</label>
            <input type="number" {...register('reorder_point', {
              required: true, min: { value: 0, message: 'Cannot be negative' }, valueAsNumber: true,
            })}
              className={`input-field ${errors.reorder_point ? 'border-rose-500/60' : ''}`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cost Price ($) *</label>
              <input type="number" step="0.01" {...register('cost_price', {
                required: true, min: { value: 0, message: 'Cannot be negative' },
              })}
                className={`input-field ${errors.cost_price ? 'border-rose-500/60' : ''}`} />
              {errors.cost_price && <p className="mt-1 text-xs text-rose-400">{errors.cost_price.message}</p>}
            </div>
            <div>
              <label className="label">Selling Price ($) *</label>
              <input type="number" step="0.01" {...register('selling_price', {
                required: true, min: { value: 0, message: 'Cannot be negative' },
              })}
                className={`input-field ${errors.selling_price ? 'border-rose-500/60' : ''}`} />
              {errors.selling_price && <p className="mt-1 text-xs text-rose-400">{errors.selling_price.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Supplier</label>
            <select {...register('supplier_id')} className="input-field">
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-white/30">
            ⚠ To change stock quantity, use the Quick Update (⚡) button on the inventory table.
          </p>

          <div className="flex gap-3 pt-2">
            <button type="button" id="cancel-edit-product" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" id="submit-edit-product" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
