import { useEffect, useState, useCallback } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { productsAPI } from '../services/api'
import { Plus, Filter, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import ProductTable from '../components/inventory/ProductTable'
import AddProductModal from '../components/inventory/AddProductModal'
import EditProductModal from '../components/inventory/EditProductModal'
import QuickUpdateModal from '../components/inventory/QuickUpdateModal'

const CATEGORIES = ['Electronics', 'Furniture', 'Stationery', 'Tools', 'Clothing', 'Food & Beverage', 'Other']

export default function InventoryPage() {
  const { isAdmin } = useAuth()
  const { search } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('low_stock') === 'true')

  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [quickTarget, setQuickTarget] = useState(null)

  const PAGE_SIZE = 10

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await productsAPI.list({
        page,
        page_size: PAGE_SIZE,
        search: search || undefined,
        category: categoryFilter || undefined,
        low_stock_only: lowStockOnly || undefined,
      })
      setProducts(data.items)
      setTotal(data.total)
      setTotalPages(data.total_pages)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryFilter, lowStockOnly])

  useEffect(() => {
    const timer = setTimeout(fetchProducts, search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [search, categoryFilter, lowStockOnly])

  const handleDelete = async (productId) => {
    if (!window.confirm('Soft-delete this product? Historical data will be preserved.')) return
    try {
      await productsAPI.delete(productId)
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-sm text-white/80
                         focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Low stock toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              id="low-stock-toggle"
              onClick={() => setLowStockOnly((p) => !p)}
              className={`w-10 h-5 rounded-full border transition-all duration-300 flex items-center px-0.5 cursor-pointer
                ${lowStockOnly ? 'bg-amber-500/40 border-amber-500/50' : 'bg-white/10 border-white/15'}`}
            >
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${lowStockOnly ? 'translate-x-5 bg-amber-400' : 'bg-white/40'}`} />
            </div>
            <span className="text-sm text-white/60">Low stock only</span>
          </label>

          <span className="text-xs text-white/30 hidden sm:block">
            {total} product{total !== 1 ? 's' : ''} found
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              id="add-product-btn"
              onClick={() => setShowAdd(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <ProductTable
        products={products}
        loading={loading}
        isAdmin={isAdmin}
        onEdit={setEditTarget}
        onDelete={handleDelete}
        onQuickUpdate={setQuickTarget}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Modals */}
      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchProducts() }}
        />
      )}
      {editTarget && (
        <EditProductModal
          product={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { setEditTarget(null); fetchProducts() }}
        />
      )}
      {quickTarget && (
        <QuickUpdateModal
          product={quickTarget}
          onClose={() => setQuickTarget(null)}
          onSuccess={() => { setQuickTarget(null); fetchProducts() }}
        />
      )}
    </div>
  )
}
