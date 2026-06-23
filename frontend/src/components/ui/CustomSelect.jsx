/**
 * CustomSelect — A fully dark-themed, styled dropdown that replaces
 * native <select> elements. Avoids all browser-native option rendering issues.
 *
 * Props:
 *   id, value, onChange, options, placeholder, className, disabled
 *   options: Array of { value: string, label: string }
 */
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function CustomSelect({
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  className = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find((o) => String(o.value) === String(value))

  const handleSelect = (optValue) => {
    onChange({ target: { value: optValue } })
    setOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className}`} id={id}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`
          w-full flex items-center justify-between gap-2
          bg-white/5 border rounded-xl px-4 py-3 text-left
          transition-all duration-200 cursor-pointer
          focus:outline-none
          ${open ? 'border-primary-500 bg-white/10' : 'border-white/10 hover:border-white/20 hover:bg-white/8'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span className={selected ? 'text-white text-sm' : 'text-white/30 text-sm'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="
            absolute z-[9999] w-full mt-1.5
            bg-[#1a1a2e] border border-white/15 rounded-xl
            shadow-2xl overflow-hidden
            max-h-60 overflow-y-auto
          "
          style={{ minWidth: '100%' }}
        >
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-white/30 text-center">No options available</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`
                  w-full text-left px-4 py-2.5 text-sm transition-colors duration-100
                  ${String(opt.value) === String(value)
                    ? 'bg-primary-600/40 text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
