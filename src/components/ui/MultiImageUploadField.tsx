import { useState, useRef } from 'react'
import { Upload, X, GripVertical, ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface MultiImageUploadFieldProps {
  label: string
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  placeholder?: string
  className?: string
}

export function MultiImageUploadField({ label, images, onChange, maxImages = 4, placeholder = 'Importer depuis votre galerie...', className }: MultiImageUploadFieldProps) {
  const [mode, setMode] = useState<'local' | 'url'>('local')
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return

    if (images.length >= maxImages) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      onChange([...images, result])
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleUrlAdd = () => {
    if (!urlInput.trim() || images.length >= maxImages) return
    onChange([...images, urlInput.trim()])
    setUrlInput('')
  }

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newImages = [...images]
    const temp = newImages[index - 1]
    newImages[index - 1] = newImages[index]
    newImages[index] = temp
    onChange(newImages)
  }

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return
    const newImages = [...images]
    const temp = newImages[index]
    newImages[index] = newImages[index + 1]
    newImages[index + 1] = temp
    onChange(newImages)
  }

  const canAddMore = images.length < maxImages

  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-xs font-semibold text-foreground">{label} ({images.length}/{maxImages})</label>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-muted border-2 border-border group">
              <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {idx > 0 && (
                  <button type="button" onClick={() => handleMoveUp(idx)} className="p-1 bg-white/20 rounded-lg hover:bg-white/40 text-white">
                    <GripVertical className="w-4 h-4" />
                  </button>
                )}
                {idx < images.length - 1 && (
                  <button type="button" onClick={() => handleMoveDown(idx)} className="p-1 bg-white/20 rounded-lg hover:bg-white/40 text-white">
                    <GripVertical className="w-4 h-4 rotate-180" />
                  </button>
                )}
                <button type="button" onClick={() => handleRemove(idx)} className="p-1 bg-red-500/80 rounded-lg hover:bg-red-500 text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {idx === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-primary text-white text-[9px] font-bold">
                  PRINCIPALE
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add More */}
      {canAddMore && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50 w-fit">
            <button
              type="button"
              onClick={() => setMode('local')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                mode === 'local' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              Importer
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                mode === 'url' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              URL
            </button>
          </div>

          {mode === 'url' ? (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-xs text-foreground"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlAdd())}
              />
              <Button type="button" size="sm" onClick={handleUrlAdd} disabled={!urlInput.trim()}>
                <ImagePlus className="w-4 h-4" /> Ajouter
              </Button>
            </div>
          ) : (
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
                {images.length === 0 ? 'Sélectionner la photo principale' : `Ajouter la photo ${images.length + 1}`}
              </button>
              <p className="text-[10px] text-muted-foreground">
                La première photo sera la photo principale de l'annonce. {maxImages - images.length} photo(s) restante(s).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
