import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { suppliersAPI } from '../services/api'
import { Plus, Pencil, X, Loader2, Building2, Mail, Phone, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function SupplierModal({ supplier, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false)
  const isEditing = Boolean(supplier)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: supplier
      ? { name: supplier.name, contact_name: supplier.contact_name || '', email: supplier.email || '', phone: supplier.phone || '', address: supplier.address || '' }
      : {},
  })

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      if (isEditing) {
        await suppliersAPI.update(supplier.id, data)
        toast.success('Supplier updated!')
      } else {
        await suppliersAPI.create(data)
        toast.success('Supplier added!')
      }
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">{isEditing ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button id="close-supplier-modal" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form id="supplier-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Company Name *</label>
            <input {...register('name', { required: 'Name is required' })}
              className={`input-field ${errors.name ? 'border-rose-500/60' : ''}`}
              placeholder="e.g. TechParts Global" />
            {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Contact Name</label>
            <input {...register('contact_name')} className="input-field" placeholder="e.g. John Smith" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input type="email" {...register('email')} className="input-field" placeholder="contact@supplier.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input-field" placeholder="+1-555-0100" />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <textarea {...register('address')} rows={2} className="input-field resize-none" placeholder="Street address…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" id="cancel-supplier" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" id="submit-supplier" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SuppliersPage() {
  const { isAdmin } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const { data } = await suppliersAPI.list({ active_only: false })
      setSuppliers(data)
    } catch { toast.error('Failed to load suppliers') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSuppliers() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this supplier?')) return
    try {
      await suppliersAPI.delete(id)
      toast.success('Supplier deactivated')
      fetchSuppliers()
    } catch { toast.error('Failed to deactivate supplier') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Supplier Directory</h2>
          <p className="text-white/40 text-sm">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button id="add-supplier-btn" onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-5 space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-4 rounded shimmer bg-white/5" />
                ))}
              </div>
            ))
          : suppliers.map((s) => (
              <div key={s.id} className="glass-card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600/30 to-accent-violet/30 border border-primary-500/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{s.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button id={`edit-supplier-${s.id}`} onClick={() => setEditTarget(s)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button id={`delete-supplier-${s.id}`} onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/30 hover:text-rose-400 transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 text-xs text-white/50">
                  {s.contact_name && <p className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> {s.contact_name}</p>}
                  {s.email        && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {s.email}</p>}
                  {s.phone        && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {s.phone}</p>}
                </div>
              </div>
            ))}
      </div>

      {(showModal || editTarget) && (
        <SupplierModal
          supplier={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSuccess={() => { setShowModal(false); setEditTarget(null); fetchSuppliers() }}
        />
      )}
    </div>
  )
}
