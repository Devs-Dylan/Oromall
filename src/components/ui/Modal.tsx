import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn('relative bg-card rounded-2xl border border-border shadow-2xl w-full animate-scale-in max-h-[90vh] flex flex-col', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-display font-bold text-foreground">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="p-6 border-t border-border">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Confirmer', danger = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void
  title: string; message: string; confirmText?: string; danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant={danger ? 'destructive' : 'primary'} onClick={() => { onConfirm(); onClose() }}>{confirmText}</Button>
        </div>
      }>
      <p className="text-muted-foreground">{message}</p>
    </Modal>
  )
}
