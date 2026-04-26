import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
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
