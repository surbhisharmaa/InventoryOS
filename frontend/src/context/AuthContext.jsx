import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || null)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await authAPI.login({ email, password })
      const userData = {
        id:        data.user_id,
        email:     data.email,
        full_name: data.full_name,
        role:      data.role,
      }
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      setToken(data.access_token)
      setUser(userData)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed. Please try again.'
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'
  const isAuthenticated = Boolean(token && user)

  return (
    <AuthContext.Provider value={{ user, token, loading, isAdmin, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
