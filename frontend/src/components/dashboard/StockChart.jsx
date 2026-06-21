import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'

const COLORS = ['#6366f1', '#22d3ee', '#a855f7', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-4 py-3 text-sm">
      <p className="font-semibold text-white mb-1">{label}</p>
      <p className="text-white/60">
        Stock: <span className="text-primary-400 font-bold">{payload[0]?.value?.toLocaleString()}</span>
      </p>
      <p className="text-white/60">
        Products: <span className="text-accent-cyan font-bold">{payload[1]?.value}</span>
      </p>
    </div>
  )
}

export default function StockChart({ data, loading }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Stock Levels by Category</h3>
          <p className="text-xs text-white/30 mt-0.5">Total units in inventory per category</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-white/50">
            <span className="w-3 h-3 rounded-sm bg-primary-500" /> Stock Units
          </span>
          <span className="flex items-center gap-1.5 text-white/50">
            <span className="w-3 h-3 rounded-sm bg-accent-cyan" /> Products
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-xl shimmer bg-white/5" />
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-white/30 text-sm">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="total_quantity" name="Stock Units" radius={[6, 6, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="product_count" name="Products" fill="rgba(34,211,238,0.6)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
