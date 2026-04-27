'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Shared base style ────────────────────────────────────────────────────────
const fieldBase =
  'w-full rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-[13px] text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-200 focus:ring-2 focus:ring-slate-100'

// ─── Primitive fields ─────────────────────────────────────────────────────────
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-mono text-[10px] uppercase tracking-wide text-text-4">
      {children}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldBase, props.className)} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldBase, 'resize-none', props.className)} />
}

export function SelectField(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldBase, props.className)} />
}

// ─── Custom select ────────────────────────────────────────────────────────────
interface SelectOption {
  value: string
  label: string
}

interface AppSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

export function AppSelect({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  className,
}: AppSelectProps) {
  const [open, setOpen]   = useState(false)
  const [rect, setRect]   = useState<DOMRect | null>(null)
  const buttonRef         = useRef<HTMLButtonElement>(null)
  const dropdownRef       = useRef<HTMLDivElement>(null)
  const selected          = options.find((o) => o.value === value)

  // Recalculate anchor position whenever the dropdown opens
  useLayoutEffect(() => {
    if (open && buttonRef.current) setRect(buttonRef.current.getBoundingClientRect())
  }, [open])

  // Close on outside click (mouse + touch)
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Close when the *page* scrolls (but not when the dropdown list itself scrolls)
  useEffect(() => {
    if (!open) return
    function onScroll(e: Event) {
      if (dropdownRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('resize', () => setOpen(false))
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', () => setOpen(false))
    }
  }, [open])

  const dropdownStyle: React.CSSProperties = rect
    ? { position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 }
    : { display: 'none' }

  function pick(val: string) {
    onChange(val)
    setOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-[13px] shadow-sm outline-none transition-all duration-200 hover:border-slate-200 focus:border-slate-200 focus:ring-2 focus:ring-slate-100"
      >
        <span className={cn('truncate text-left', selected ? 'text-slate-900' : 'text-slate-400')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'flex-shrink-0 text-slate-400 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-slate-100 bg-white shadow-2xl"
        >
          {/* "Clear" option */}
          <button
            type="button"
            onClick={() => pick('')}
            className="w-full px-3 py-2.5 text-left text-[13px] text-slate-400 transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            {placeholder}
          </button>

          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => pick(opt.value)}
              className={cn(
                'w-full px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-slate-50 active:bg-slate-100',
                value === opt.value
                  ? 'bg-amber-50 font-medium text-amber-900'
                  : 'text-slate-700',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
