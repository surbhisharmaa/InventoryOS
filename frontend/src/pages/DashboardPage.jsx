import { useEffect, useState } from 'react'
import { analyticsAPI, stockAPI } from '../services/api'
import { Package, AlertTriangle, TrendingUp, DollarSign, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import StockChart from '../components/dashboard/StockChart'
import MetricsBar from '../components/dashboard/MetricsBar'
import LowStockAlert from '../components/dashboard/LowStockAlert'

export default function DashboardPage() {
  const { isAdmin } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [categories, setCategories] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = async () => {
    try {
      const [metricsRes, catRes, lowRes] = await Promise.allSettled([
        analyticsAPI.dashboard(),
        analyticsAPI.stockByCategory(),
        stockAPI.getLowStock(),
      ])
      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data)
      else toast.error('Failed to load metrics')

      if (catRes.status === 'fulfilled') setCategories(catRes.value.data)
      else toast.error('Failed to load category data')

      if (lowRes.status === 'fulfilled') setLowStock(lowRes.value.data)
      // low-stock failure is non-critical, silently ignore
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAll()
  }

  const handleCheckAlerts = async () => {
    try {
      const { data } = await stockAPI.checkAlerts()
      toast.success(data.message)
      fetchAll()
    } catch {
      toast.error('Alert check failed')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Hub</h2>
          <p className="text-white/40 text-sm mt-0.5">Real-time inventory intelligence</p>
        </div>
        <div className="flex gap-2">
          <button
            id="check-alerts-btn"
            onClick={handleCheckAlerts}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Check Alerts
          </button>
          <button
            id="refresh-dashboard-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {!loading && lowStock.length > 0 && (
        <LowStockAlert items={lowStock} />
      )}

      {/* Metrics Cards */}
      <MetricsBar metrics={metrics} loading={loading} isAdmin={isAdmin} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <StockChart data={categories} loading={loading} />
        </div>

        {/* Category Summary Table */}
        <div className="glass-card p-5">
          <h3 className="text-base font-semibold text-white mb-4">Category Breakdown</h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg shimmer bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat, i) => (
                <div key={cat.category} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-sm text-white/80">{cat.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{cat.total_quantity.toLocaleString()}</p>
                    <p className="text-[10px] text-white/30">{cat.product_count} SKUs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const CHART_COLORS = ['#6366f1', '#22d3ee', '#a855f7', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6']
