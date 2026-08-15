import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

let toastFn: ((t: Omit<Toast, 'id'>) => void) | null = null

export function toast(t: Omit<Toast, 'id'>) { toastFn?.(t) }
export const toastSuccess = (title: string, message?: string) => toast({ type: 'success', title, message })
export const toastError = (title: string, message?: string) => toast({ type: 'error', title, message })
export const toastInfo = (title: string, message?: string) => toast({ type: 'info', title, message })

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastFn = (t) => {
      const id = Math.random().toString(36).slice(2)
      setToasts(prev => [...prev, { ...t, id }])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000)
    }
    return () => { toastFn = null }
  }, [])

  const icons = { success: CheckCircle, error: AlertCircle, info: Info, warning: AlertTriangle }
  const colors = {
    success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/30',
    error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30',
    info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30',
    warning: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30',
  }
  const iconColors = {
    success: 'text-emerald-600', error: 'text-red-600',
    info: 'text-blue-600', warning: 'text-amber-600',
  }

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => {
        const Icon = icons[t.type]
        return (
          <div key={t.id} className={cn('flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-up', colors[t.type])}>
            <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', iconColors[t.type])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t.title}</p>
              {t.message && <p className="text-xs text-muted-foreground mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body
  )
}
