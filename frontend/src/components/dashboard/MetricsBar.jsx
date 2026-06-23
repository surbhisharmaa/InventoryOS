import { Package, AlertTriangle, DollarSign, TrendingUp, Users, ShoppingCart } from 'lucide-react'

function MetricCard({ id, title, value, subtitle, icon: Icon, iconColor, glowClass, loading }) {
  return (
    <div id={id} className="metric-card">
      {/* Background glow */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${glowClass}`} />

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{title}</p>
          {loading ? (
            <div className="h-8 w-28 mt-2 rounded-lg shimmer bg-white/5" />
          ) : (
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          )}
          {subtitle && (
            <p className="text-xs text-white/30 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default function MetricsBar({ metrics, loading, isAdmin }) {
  const totalValue = metrics?.total_inventory_value
    ? `$${metrics.total_inventory_value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
    : '$0'

  const monthlyRevenue = metrics?.monthly_revenue != null
    ? `$${metrics.monthly_revenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
    : '—'

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
      <MetricCard
        id="metric-total-products"
        title="Total Products"
        value={loading ? '…' : metrics?.total_products?.toLocaleString() ?? '0'}
        subtitle="Active SKUs in system"
        icon={Package}
        iconColor="text-primary-400"
        glowClass="bg-primary-500"
        loading={loading}
      />
      <MetricCard
        id="metric-low-stock"
        title="Low Stock Items"
        value={loading ? '…' : metrics?.low_stock_count ?? '0'}
        subtitle={`${metrics?.out_of_stock_count ?? 0} out of stock`}
        icon={AlertTriangle}
        iconColor="text-amber-400"
        glowClass="bg-amber-500"
        loading={loading}
      />
      <MetricCard
        id="metric-inventory-value"
        title="Inventory Value"
        value={loading ? '…' : totalValue}
        subtitle="Total cost basis"
        icon={DollarSign}
        iconColor="text-emerald-400"
        glowClass="bg-emerald-500"
        loading={loading}
      />
      <MetricCard
        id="metric-total-customers"
        title="Total Customers"
        value={loading ? '…' : metrics?.total_customers?.toLocaleString() ?? '0'}
        subtitle="Registered customers"
        icon={Users}
        iconColor="text-accent-cyan"
        glowClass="bg-accent-cyan"
        loading={loading}
      />
      <MetricCard
        id="metric-total-orders"
        title="Total Orders"
        value={loading ? '…' : metrics?.total_orders?.toLocaleString() ?? '0'}
        subtitle="All time orders"
        icon={ShoppingCart}
        iconColor="text-accent-violet"
        glowClass="bg-accent-violet"
        loading={loading}
      />
      <MetricCard
        id="metric-monthly-revenue"
        title="Monthly Revenue"
        value={loading ? '…' : isAdmin ? monthlyRevenue : 'Restricted'}
        subtitle={isAdmin ? 'Sales this month' : 'Admin access only'}
        icon={TrendingUp}
        iconColor={isAdmin ? 'text-accent-violet' : 'text-white/20'}
        glowClass="bg-accent-violet"
        loading={loading}
      />
    </div>
  )
}
