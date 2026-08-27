import { useState, useRef } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface FileUploadFieldProps {
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  accept?: string
  maxSizeMB?: number
  className?: string
}

export function FileUploadField({ label, value, onChange, accept = '*/*', maxSizeMB = 50, className }: FileUploadFieldProps) {
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${maxSizeMB} Mo)`)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      onChange(result)
      setFileName(file.name)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleRemove = () => {
    onChange(undefined)
    setFileName('')
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-xs font-semibold text-foreground">{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <Upload className="w-4 h-4" />
        {fileName ? 'Changer le fichier' : 'Sélectionner un fichier'}
      </button>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
      {fileName && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border/40">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground truncate max-w-[200px]">{fileName}</span>
          </div>
          <button type="button" onClick={handleRemove} className="p-1 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {value && !fileName && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border/40">
          <span className="text-xs text-foreground">Fichier chargé</span>
          <button type="button" onClick={handleRemove} className="p-1 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
