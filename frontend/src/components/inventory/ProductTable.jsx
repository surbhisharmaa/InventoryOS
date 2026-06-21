import { Pencil, Trash2, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

function StockBadge({ quantity, reorderPoint }) {
  if (quantity === 0) {
    return <span className="badge-red">● Out of Stock</span>
  }
  if (quantity <= reorderPoint) {
    return <span className="badge-orange">● Low Stock</span>
  }
  return <span className="badge-green">● In Stock</span>
}

const SKELETON_ROWS = 8

export default function ProductTable({
  products, loading, isAdmin, onEdit, onDelete, onQuickUpdate,
  page, totalPages, onPageChange,
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/8 bg-white/3">
            <tr>
              <th className="table-header text-left">SKU</th>
              <th className="table-header text-left">Product</th>
              <th className="table-header text-left">Category</th>
              <th className="table-header text-right">Qty</th>
              <th className="table-header text-right">Reorder Pt.</th>
              <th className="table-header text-right">Cost</th>
              <th className="table-header text-right">Price</th>
              <th className="table-header text-center">Status</th>
              <th className="table-header text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(SKELETON_ROWS)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 rounded shimmer bg-white/5" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              : products.length === 0
              ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-white/30 text-sm">
                    No products found. {isAdmin && 'Click "Add Product" to get started.'}
                  </td>
                </tr>
              )
              : products.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="table-cell">
                    <span className="font-mono text-xs bg-white/8 px-2 py-1 rounded-lg text-primary-300">
                      {p.sku}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-white text-sm">{p.name}</p>
                      {p.supplier && (
                        <p className="text-xs text-white/30 mt-0.5">{p.supplier.name}</p>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-xs bg-white/8 px-2 py-1 rounded-lg text-white/60">
                      {p.category}
                    </span>
                  </td>
                  <td className="table-cell text-right font-semibold">{p.quantity.toLocaleString()}</td>
                  <td className="table-cell text-right text-white/40">{p.reorder_point}</td>
                  <td className="table-cell text-right text-white/60">${Number(p.cost_price).toFixed(2)}</td>
                  <td className="table-cell text-right font-medium text-emerald-400">
                    ${Number(p.selling_price).toFixed(2)}
                  </td>
                  <td className="table-cell text-center">
                    <StockBadge quantity={p.quantity} reorderPoint={p.reorder_point} />
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        id={`quick-update-${p.id}`}
                        onClick={() => onQuickUpdate(p)}
                        className="p-1.5 rounded-lg hover:bg-primary-500/20 text-white/40 hover:text-primary-400 transition-all"
                        title="Quick stock update"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            id={`edit-${p.id}`}
                            onClick={() => onEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
                            title="Edit product"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-${p.id}`}
                            onClick={() => onDelete(p.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-all"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <p className="text-xs text-white/30">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              id="prev-page-btn"
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  id={`page-btn-${pageNum}`}
                  onClick={() => onPageChange(pageNum)}
                  className={clsx(
                    'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                    pageNum === page
                      ? 'bg-primary-600 text-white'
                      : 'text-white/40 hover:text-white hover:bg-white/10'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              id="next-page-btn"
              onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
