import { useEffect, useState } from 'react'
import { stockAPI } from '../services/api'
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TYPE_CONFIG = {
  IN:         { label: 'Stock In',    icon: ArrowUpCircle,   class: 'text-emerald-400 bg-emerald-500/10' },
  OUT:        { label: 'Stock Out',   icon: ArrowDownCircle, class: 'text-rose-400 bg-rose-500/10' },
  ADJUSTMENT: { label: 'Adjustment', icon: RefreshCw,        class: 'text-primary-400 bg-primary-500/10' },
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const PAGE_SIZE = 15

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const { data } = await stockAPI.listTransactions({ page, page_size: PAGE_SIZE })
        setTransactions(data.items)
        setTotal(data.total)
        setTotalPages(data.total_pages)
      } catch { toast.error('Failed to load transactions') }
      finally { setLoading(false) }
    })()
  }, [page])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Transaction History</h2>
        <p className="text-white/40 text-sm mt-0.5">{total.toLocaleString()} total stock movements</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/8 bg-white/3">
              <tr>
                <th className="table-header text-left">Type</th>
                <th className="table-header text-left">Product ID</th>
                <th className="table-header text-right">Before</th>
                <th className="table-header text-right">Changed</th>
                <th className="table-header text-right">After</th>
                <th className="table-header text-left">Notes</th>
                <th className="table-header text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-4 rounded shimmer bg-white/5" />
                        </td>
                      ))}
                    </tr>
                  ))
                : transactions.map((tx) => {
                    const cfg = TYPE_CONFIG[tx.transaction_type]
                    const TxIcon = cfg?.icon || RefreshCw
                    return (
                      <tr key={tx.id} className="table-row">
                        <td className="table-cell">
                          <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold', cfg?.class)}>
                            <TxIcon className="w-3.5 h-3.5" />
                            {cfg?.label}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="font-mono text-xs text-white/50 truncate block max-w-[140px]">
                            {tx.product_id}
                          </span>
                        </td>
                        <td className="table-cell text-right text-white/50">{tx.quantity_before}</td>
                        <td className="table-cell text-right font-semibold">
                          <span className={tx.transaction_type === 'OUT' ? 'text-rose-400' : 'text-emerald-400'}>
                            {tx.transaction_type === 'OUT' ? '-' : '+'}{tx.quantity_changed}
                          </span>
                        </td>
                        <td className="table-cell text-right text-white font-bold">{tx.quantity_after}</td>
                        <td className="table-cell text-white/40 text-xs max-w-[200px] truncate">{tx.notes || '—'}</td>
                        <td className="table-cell text-right text-white/40 text-xs whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-xs text-white/30">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button
                id="tx-prev-page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="tx-next-page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
