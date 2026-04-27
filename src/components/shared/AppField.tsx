'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const baseClassName =
  'w-full rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-[13px] text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-200 focus:ring-2 focus:ring-slate-100'

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="font-mono text-[10px] uppercase tracking-wide text-text-4">{children}</label>
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(baseClassName, props.className)} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(baseClassName, 'resize-none', props.className)} />
}

export function SelectField(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(baseClassName, props.className)} />
}

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

export function AppSelect({ value, onChange, options, placeholder = 'Выберите...', className }: AppSelectProps) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  // Recalculate dropdown position on open
  useLayoutEffect(() => {
    if (open && buttonRef.current) {
      setRect(buttonRef.current.getBoundingClientRect())
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  // Close on scroll / resize
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const dropdownStyle: React.CSSProperties = rect
    ? {
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      }
    : { display: 'none' }

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-[13px] shadow-sm outline-none transition-all duration-200 hover:border-slate-200 focus:border-slate-200 focus:ring-2 focus:ring-slate-100"
      >
        <span className={cn('truncate', selected ? 'text-slate-900' : 'text-slate-400')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          className={cn('flex-shrink-0 text-slate-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="max-h-64 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-2xl"
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onChange(''); setOpen(false) }}
            className="w-full px-3 py-2.5 text-left text-[13px] text-slate-400 transition-colors hover:bg-slate-50"
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={cn(
                'w-full px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-slate-50',
                value === option.value ? 'bg-amber-50 font-medium text-amber-900' : 'text-slate-700',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
