import { AlertTriangle, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function LowStockAlert({ items }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="font-semibold text-amber-300 text-sm">
            {items.length} Low Stock {items.length === 1 ? 'Alert' : 'Alerts'}
          </p>
          <p className="text-xs text-amber-400/70 mt-0.5">
            {items.slice(0, 3).map((i) => i.name).join(', ')}
            {items.length > 3 && ` +${items.length - 3} more`} — reorder required
          </p>
        </div>
      </div>
      <button
        id="view-low-stock-btn"
        onClick={() => navigate('/inventory?low_stock=true')}
        className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0"
      >
        View All <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
