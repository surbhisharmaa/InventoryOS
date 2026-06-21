import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const location = useLocation()

  const showSearch = ['/inventory'].includes(location.pathname)

  return (
    <div className="flex h-screen bg-surface-900 overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onSearch={showSearch ? setSearch : undefined}
          searchValue={showSearch ? search : undefined}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet context={{ search, setSearch }} />
          </div>
        </main>
      </div>
    </div>
  )
}
