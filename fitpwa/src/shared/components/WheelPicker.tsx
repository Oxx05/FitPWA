import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/utils/cn'

interface WheelPickerProps {
  options: number[]
  value: number
  onChange: (value: number) => void
  label?: string
  className?: string
}

export function WheelPicker({ options, value, onChange, label, className }: WheelPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  
  // Item height in pixels
  const ITEM_HEIGHT = 44

  useEffect(() => {
    if (scrollRef.current && !isScrolling) {
      const index = options.indexOf(value)
      if (index !== -1) {
        scrollRef.current.scrollTop = index * ITEM_HEIGHT
      }
    }
  }, [value, options, isScrolling])

  const handleScroll = () => {
    if (!scrollRef.current) return
    setIsScrolling(true)
    
    // Smooth snapping detection
    const scrollTop = scrollRef.current.scrollTop
    const index = Math.round(scrollTop / ITEM_HEIGHT)
    
    if (index >= 0 && index < options.length) {
      const newValue = options[index]
      if (newValue !== value) {
        onChange(newValue)
      }
    }
    
    // Reset scrolling state after a delay
    setTimeout(() => setIsScrolling(false), 150)
  }

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      {label && <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</span>}
      
      <div className="relative h-[132px] w-16 bg-surface-200/50 rounded-2xl overflow-hidden border border-white/5 shadow-inner">
        {/* Selection Highlight */}
        <div className="absolute top-[44px] left-0 right-0 h-[44px] bg-primary/10 border-y border-primary/20 pointer-events-none z-10" />
        
        {/* Gradient Overlays */}
        <div className="absolute top-0 left-0 right-0 h-[44px] bg-gradient-to-b from-surface-200 to-transparent pointer-events-none z-20" />
        <div className="absolute bottom-0 left-0 right-0 h-[44px] bg-gradient-to-t from-surface-200 to-transparent pointer-events-none z-20" />

        {/* Scrollable Area */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-scroll no-scrollbar snap-y snap-mandatory py-[44px]"
          style={{ scrollBehavior: 'smooth' }}
        >
          {options.map((option) => (
            <div 
              key={option}
              className={cn(
                "h-[44px] flex items-center justify-center text-lg font-black transition-all snap-center",
                value === option ? "text-primary scale-110" : "text-gray-600 scale-90"
              )}
            >
              {option.toString().padStart(2, '0')}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
