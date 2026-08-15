import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="form-group">
        {label && <label className="form-label">{label}</label>}
        <div className="relative">
          {leftIcon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{leftIcon}</span>}
          <input
            ref={ref}
            className={cn(
              'input-field',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-destructive focus:ring-destructive/30 focus:border-destructive',
              className
            )}
            {...props}
          />
          {rightIcon && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{rightIcon}</span>}
        </div>
        {hint && !error && <p className="form-hint">{hint}</p>}
        {error && <p className="form-hint text-destructive">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, ...props }, ref) => (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <textarea
        ref={ref}
        className={cn('input-field resize-none', error && 'border-destructive', className)}
        {...props}
      />
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-hint text-destructive">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}
export function Select({ label, hint, error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className={cn('input-field', error && 'border-destructive', className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-hint text-destructive">{error}</p>}
    </div>
  )
}
