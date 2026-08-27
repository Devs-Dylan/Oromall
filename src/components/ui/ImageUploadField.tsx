import { useState, useRef } from 'react'
import { Upload, Link } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  aspectRatio?: string
}

export function ImageUploadField({ label, value, onChange, placeholder = 'Importer depuis votre galerie...', className, aspectRatio }: ImageUploadFieldProps) {
  const [mode, setMode] = useState<'local' | 'url'>('local')
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setPreview(result)
      onChange(result)
    }
    reader.readAsDataURL(file)

    e.target.value = ''
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    onChange(url)
    setPreview(url || null)
  }

  const handleModeChange = (newMode: 'url' | 'local') => {
    setMode(newMode)
    if (newMode === 'url') {
      setPreview(value || null)
    } else {
      setPreview(null)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-xs font-semibold text-foreground">{label}</label>

      {/* Radio Buttons */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50 w-fit">
        <button
          type="button"
          onClick={() => handleModeChange('local')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            mode === 'local'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Upload className="w-3.5 h-3.5" />
          Importer
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('url')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            mode === 'url'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Link className="w-3.5 h-3.5" />
          URL
        </button>
      </div>

      {/* URL Input */}
      {mode === 'url' && (
        <input
          type="url"
          value={value}
          onChange={handleUrlChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-xs text-foreground"
        />
      )}

      {/* Local File Input */}
      {mode === 'local' && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {preview ? 'Changer l\'image' : 'Sélectionner une image'}
          </button>
        </div>
      )}

      {/* Preview */}
      {(preview || value) && (
        <div className="mt-2 p-2 rounded-xl bg-muted/30 border border-border/40">
          <img
            src={preview || value}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}
