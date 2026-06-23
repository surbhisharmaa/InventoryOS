import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Loader2 } from 'lucide-react'
import { productsAPI, suppliersAPI } from '../../services/api'
import toast from 'react-hot-toast'
import CustomSelect from '../ui/CustomSelect'

const CATEGORIES = ['Electronics', 'Furniture', 'Stationery', 'Tools', 'Clothing', 'Food & Beverage', 'Other']

export default function AddProductModal({ onClose, onSuccess }) {
  const [suppliers, setSuppliers] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { quantity: 0, reorder_point: 10, cost_price: 0, selling_price: 0 },
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
        quantity: parseInt(data.quantity),
        reorder_point: parseInt(data.reorder_point),
        cost_price: parseFloat(data.cost_price),
        selling_price: parseFloat(data.selling_price),
        supplier_id: data.supplier_id || null,
      }
      await productsAPI.create(payload)
      toast.success('Product created successfully!')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Add New Product</h2>
          <button id="close-add-modal" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="add-product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">SKU *</label>
              <input {...register('sku', { required: 'SKU is required' })}
                className={`input-field ${errors.sku ? 'border-rose-500/60' : ''}`}
                placeholder="e.g. PROD-001" />
              {errors.sku && <p className="mt-1 text-xs text-rose-400">{errors.sku.message}</p>}
            </div>
            <div>
              <label className="label">Category *</label>
              <input type="hidden" {...register('category', { required: 'Category is required' })} />
              <CustomSelect
                id="product-category"
                value={watch('category') || ''}
                onChange={(e) => setValue('category', e.target.value, { shouldValidate: true })}
                placeholder="Select category…"
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                className={errors.category ? 'ring-1 ring-rose-500/60 rounded-xl' : ''}
              />
              {errors.category && <p className="mt-1 text-xs text-rose-400">{errors.category.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Product Name *</label>
            <input {...register('name', { required: 'Name is required' })}
              className={`input-field ${errors.name ? 'border-rose-500/60' : ''}`}
              placeholder="e.g. Wireless Ergonomic Mouse" />
            {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={2}
              className="input-field resize-none" placeholder="Optional product description…" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" {...register('quantity', {
                required: true, min: { value: 0, message: 'Cannot be negative' }, valueAsNumber: true,
              })}
                className={`input-field ${errors.quantity ? 'border-rose-500/60' : ''}`} />
              {errors.quantity && <p className="mt-1 text-xs text-rose-400">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="label">Reorder Point *</label>
              <input type="number" {...register('reorder_point', {
                required: true, min: { value: 0, message: 'Cannot be negative' }, valueAsNumber: true,
              })}
                className={`input-field ${errors.reorder_point ? 'border-rose-500/60' : ''}`} />
            </div>
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
            <CustomSelect
              id="product-supplier"
              value={watch('supplier_id') || ''}
              onChange={(e) => setValue('supplier_id', e.target.value)}
              placeholder="No supplier"
              options={[
                { value: '', label: 'No supplier' },
                ...suppliers.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" id="cancel-add-product" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" id="submit-add-product" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
