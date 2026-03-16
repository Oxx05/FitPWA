import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/shared/components/Button'

interface NoteEditorProps {
  initialContent?: string
  initialTags?: string[]
  onSave?: (content: string, tags: string[], pain: number, fatigue: number) => void
  onCancel?: () => void
}

const AVAILABLE_TAGS = ['PR', 'Lesão', 'Fácil', 'Difícil', 'Foco', 'Cansado']

export function NoteEditor({ initialContent = '', initialTags = [], onSave, onCancel }: NoteEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [painLevel, setPainLevel] = useState(0)
  const [fatigueLevel, setFatigueLevel] = useState(0)

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const handleSave = () => {
    onSave?.(content, tags, painLevel, fatigueLevel)
  }

  return (
    <div className="bg-surface-200 border border-surface-100 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
      <h3 className="text-xl font-bold text-white">Adicionar Nota</h3>
      
      <textarea
        className="w-full bg-surface-100 border border-surface-200 rounded-lg p-3 text-white placeholder:text-gray-500 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        placeholder="O que sentiste durante o exercício/sessão?"
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      <div>
        <label className="text-sm text-gray-400 font-medium mb-2 block">Tags Rápidas</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                tags.includes(tag) 
                  ? tag === 'Lesão' ? 'bg-error/20 border-error text-error' : 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface-100 border-surface-200 text-gray-400 hover:border-gray-500'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {tags.includes('Lesão') && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
          <label className="text-sm text-gray-400 font-medium mb-2 flex justify-between">
            <span>Nível de Dor</span>
            <span className="text-error">{painLevel}/5</span>
          </label>
          <input 
            type="range" 
            min="0" max="5" 
            value={painLevel} 
            onChange={e => setPainLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-error"
          />
        </div>
      )}

      <div>
        <label className="text-sm text-gray-400 font-medium mb-2 flex justify-between">
          <span>Nível de Fadiga</span>
          <span className="text-primary">{fatigueLevel}/5</span>
        </label>
        <input 
          type="range" 
          min="0" max="5" 
          value={fatigueLevel} 
          onChange={e => setFatigueLevel(parseInt(e.target.value))}
          className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <Button variant="ghost" onClick={onCancel} className="text-gray-400">
          <X className="w-5 h-5 mr-1" /> Cancelar
        </Button>
        <Button onClick={handleSave}>
          <Check className="w-5 h-5 mr-1" /> Guardar
        </Button>
      </div>
    </div>
  )
}
