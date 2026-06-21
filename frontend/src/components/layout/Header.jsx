import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, User, Settings, LogOut, X, AlertTriangle, CheckCircle, Shield, Mail, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useState, useRef, useEffect } from 'react'

const PAGE_TITLES = {
  '/dashboard':    { title: 'Dashboard',    subtitle: 'Overview & Analytics' },
  '/inventory':    { title: 'Inventory',    subtitle: 'Manage products & stock' },
  '/suppliers':    { title: 'Suppliers',    subtitle: 'Supplier directory' },
  '/transactions': { title: 'Transactions', subtitle: 'Stock movement history' },
}

const SAMPLE_NOTIFICATIONS = [
  { id: 1, type: 'warning', icon: AlertTriangle, title: 'Low Stock Alert', body: 'Wireless Keyboard is running low (3 units)', time: '2m ago', read: false },
  { id: 2, type: 'success', icon: CheckCircle, title: 'Purchase Order Created', body: 'Auto-reorder placed for USB-C Hub (20 units)', time: '15m ago', read: false },
  { id: 3, type: 'warning', icon: AlertTriangle, title: 'Out of Stock', body: 'Screwdriver Set has 0 units remaining', time: '1h ago', read: true },
]

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

/* ── Profile Modal ───────────────────────────────────────────────────────── */
function ProfileModal({ user, onClose }) {
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-surface-800 shadow-2xl overflow-hidden animate-fade-in">
        {/* Header gradient bar */}
        <div className="h-24 bg-gradient-to-br from-primary-600/60 to-accent-violet/60" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div className="absolute top-10 left-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center text-white text-2xl font-bold shadow-glow-primary border-2 border-surface-800">
          {initials}
        </div>

        <div className="px-6 pb-6 pt-10">
          <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
          <p className="text-sm text-white/40 mt-0.5">{user?.email}</p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <Shield className="w-4 h-4 text-accent-violet flex-shrink-0" />
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-wider">Role</p>
                <p className="text-sm font-semibold text-white capitalize">{user?.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <Mail className="w-4 h-4 text-accent-cyan flex-shrink-0" />
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-white">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-wider">Session</p>
                <p className="text-sm font-semibold text-white">Active now</p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-5 w-full py-2.5 rounded-xl bg-primary-600/20 border border-primary-500/30 text-primary-400 text-sm font-medium hover:bg-primary-600/30 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Settings Modal ──────────────────────────────────────────────────────── */
function SettingsModal({ onClose }) {
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [autoReorder, setAutoReorder] = useState(true)
  const [compactMode, setCompactMode] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-surface-800 shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white/60" />
            </div>
            <h2 className="text-base font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-1">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-3">Preferences</p>

          {[
            { label: 'Stock Notifications', desc: 'Alert when items fall below reorder point', value: notifEnabled, set: setNotifEnabled },
            { label: 'Auto-Reorder Orders', desc: 'Automatically create purchase orders on low stock', value: autoReorder, set: setAutoReorder },
            { label: 'Compact Mode', desc: 'Reduce spacing for a denser layout', value: compactMode, set: setCompactMode },
          ].map(({ label, desc, value, set }) => (
            <div
              key={label}
              className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-white/35 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => set(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? 'bg-primary-600' : 'bg-white/10'}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Header ──────────────────────────────────────────────────────────────── */
export default function Header({ onSearch, searchValue }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'InventoryOS', subtitle: '' }
  const now = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const [showNotif, setShowNotif]       = useState(false)
  const [showProfile, setShowProfile]   = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS)

  const notifRef   = useRef(null)
  const profileRef = useRef(null)

  useClickOutside(notifRef,   () => setShowNotif(false))
  useClickOutside(profileRef, () => setShowProfile(false))

  const unreadCount = notifications.filter(n => !n.read).length
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const dismissNotif = (id) => setNotifications(prev => prev.filter(n => n.id !== id))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const openProfile = () => {
    setShowProfile(false)
    setShowProfileModal(true)
  }

  const openSettings = () => {
    setShowProfile(false)
    setShowSettingsModal(true)
  }

  return (
    <>
      <header className="relative z-30 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-surface-800/50 backdrop-blur-sm">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold text-white">{pageInfo.title}</h1>
          <p className="text-sm text-white/40">{pageInfo.subtitle} · {now}</p>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                id="header-search"
                type="text"
                placeholder="Search products…"
                value={searchValue || ''}
                onChange={(e) => onSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white
                           placeholder-white/30 focus:outline-none focus:border-primary-500 w-56 transition-all"
              />
            </div>
          )}

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              id="notification-btn"
              onClick={() => { setShowNotif(v => !v); setShowProfile(false) }}
              className="relative p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-rose border border-surface-800 animate-pulse" />
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-surface-800/95 backdrop-blur-xl shadow-2xl overflow-hidden" style={{ zIndex: 9999 }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div>
                    <p className="text-sm font-semibold text-white">Notifications</p>
                    {unreadCount > 0 && <p className="text-xs text-white/40">{unreadCount} unread</p>}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-white/30 text-sm">No notifications</div>
                  ) : (
                    notifications.map(({ id, type, icon: Icon, title, body, time, read }) => (
                      <div
                        key={id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0 transition-colors ${read ? 'opacity-60' : 'bg-white/3'}`}
                      >
                        <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${type === 'warning' ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                          <Icon className={`w-4 h-4 ${type === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white">{title}</p>
                          <p className="text-xs text-white/50 mt-0.5 truncate">{body}</p>
                          <p className="text-[10px] text-white/25 mt-1">{time}</p>
                        </div>
                        <button onClick={() => dismissNotif(id)} className="text-white/20 hover:text-white/60 transition-colors mt-0.5">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <div className="relative" ref={profileRef}>
            <button
              id="profile-btn"
              onClick={() => { setShowProfile(v => !v); setShowNotif(false) }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center text-white text-sm font-bold shadow-glow-primary hover:scale-105 transition-transform cursor-pointer"
              aria-label="Profile menu"
            >
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/10 bg-surface-800/95 backdrop-blur-xl shadow-2xl overflow-hidden" style={{ zIndex: 9999 }}>
                {/* User info header */}
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
                  <p className="text-xs text-white/40 truncate">{user?.email}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    id="profile-menu-profile"
                    onClick={openProfile}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </button>
                  <button
                    id="profile-menu-settings"
                    onClick={openSettings}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>

                <div className="border-t border-white/5 py-1">
                  <button
                    id="profile-menu-logout"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals rendered outside header so they sit above everything */}
      {showProfileModal  && <ProfileModal  user={user} onClose={() => setShowProfileModal(false)} />}
      {showSettingsModal && <SettingsModal              onClose={() => setShowSettingsModal(false)} />}
    </>
  )
}
