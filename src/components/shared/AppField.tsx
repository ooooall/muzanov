'use client'

import { useEffect, useRef, useState } from 'react'
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
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
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

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-xl">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className="w-full px-3 py-2.5 text-left text-[13px] text-slate-400 transition-colors hover:bg-slate-50"
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={cn(
                'w-full px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-slate-50',
                value === option.value ? 'bg-amber-50 font-medium text-amber-900' : 'text-slate-700',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
