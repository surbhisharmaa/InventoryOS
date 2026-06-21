import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Boxes, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  const onSubmit = async (data) => {
    setServerError('')
    const result = await login(data.email, data.password)
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    } else {
      setServerError(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent-violet/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center mb-4 shadow-glow-primary">
            <Boxes className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">InventoryOS</h1>
          <p className="text-white/40 text-sm mt-1">Production Inventory Management</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-white mb-1">Sign in to your account</h2>
          <p className="text-white/40 text-sm mb-6">Enter your credentials to continue</p>

          {/* Server Error Banner */}
          {serverError && (
            <div className="flex items-center gap-2 bg-rose-500/15 border border-rose-500/30 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <p className="text-rose-400 text-sm">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@inventory.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  className={`input-field pl-10 ${errors.email ? 'border-rose-500/60' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                  className={`input-field pl-10 pr-12 ${errors.password ? 'border-rose-500/60' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 pt-5 border-t border-white/8">
            <p className="text-xs text-white/30 text-center mb-3">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card px-3 py-2 text-center">
                <p className="text-xs font-semibold text-accent-violet">Admin</p>
                <p className="text-[10px] text-white/40 mt-0.5">admin@inventory.com</p>
                <p className="text-[10px] text-white/40 font-mono">Admin@123456</p>
              </div>
              <div className="glass-card px-3 py-2 text-center">
                <p className="text-xs font-semibold text-accent-cyan">Staff</p>
                <p className="text-[10px] text-white/40 mt-0.5">Register via API</p>
                <p className="text-[10px] text-white/40 font-mono">role: staff</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
