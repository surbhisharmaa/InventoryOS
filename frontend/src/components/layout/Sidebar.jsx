import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Package, Truck, ArrowLeftRight,
  ChevronLeft, ChevronRight, Boxes, Users, ShoppingCart,
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/inventory',    label: 'Inventory',    icon: Package },
  { to: '/customers',    label: 'Customers',    icon: Users },
  { to: '/orders',       label: 'Orders',       icon: ShoppingCart },
  { to: '/suppliers',    label: 'Suppliers',    icon: Truck },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, isAdmin } = useAuth()

  return (
    <aside
      className={clsx(
        'relative flex flex-col h-full bg-surface-800 border-r border-white/5 transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 px-4 py-5 border-b border-white/5', collapsed && 'justify-center px-2')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center flex-shrink-0 shadow-glow-primary">
          <Boxes className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white text-sm leading-tight gradient-text">InventoryOS</p>
            <p className="text-xs text-white/40 truncate">v1.0 Production</p>
          </div>
        )}
      </div>

      {/* Toggle Button — floating pill on the right edge */}
      <button
        onClick={onToggle}
        id="sidebar-toggle-btn"
        className={clsx(
          'absolute -right-3 top-[52px] z-10 w-6 h-6 rounded-full',
          'bg-surface-700 border border-white/10 shadow-lg',
          'flex items-center justify-center',
          'text-white/50 hover:text-white hover:bg-primary-600/40 transition-all duration-200'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5" />
          : <ChevronLeft className="w-3.5 h-3.5" />
        }
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-4 mb-2 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
            Main Menu
          </p>
        )}
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-white bg-primary-600/30 border border-primary-500/30 shadow-glow-primary'
                  : 'text-white/60 hover:text-white hover:bg-white/8',
                collapsed && 'justify-center px-2'
              )
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info — sign out lives in the header profile dropdown */}
      {!collapsed && (
        <div className="px-3 py-4 border-t border-white/5">
          <div className="glass-card px-3 py-2.5">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
            <span
              className={clsx(
                'mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                isAdmin
                  ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30'
                  : 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
              )}
            >
              {user?.role}
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}
