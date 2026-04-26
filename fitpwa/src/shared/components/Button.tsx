import React from 'react'
import { cn } from '@/shared/utils/cn'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

/**
 * Editorial button — sharp typography, tactile press, signature lime glow.
 * Variants:
 *  - primary  : the workhorse acid-lime CTA
 *  - accent   : magenta — for destructive-positive moments (finish, claim, unlock)
 *  - secondary: elevated dark surface
 *  - outline  : ghost with hairline border
 *  - ghost    : transparent, hover-only
 *  - danger   : error red
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants: Record<string, string> = {
      primary:
        'bg-primary text-black hover:bg-primary-hover active:bg-primary-deep shadow-[0_4px_24px_-6px_rgba(198,255,61,0.55)] hover:shadow-[0_8px_32px_-4px_rgba(198,255,61,0.75)]',
      accent:
        'bg-accent text-white hover:bg-accent-hover shadow-[0_4px_24px_-6px_rgba(255,45,117,0.55)] hover:shadow-[0_8px_32px_-4px_rgba(255,45,117,0.75)]',
      secondary:
        'bg-surface-50 text-white hover:bg-surface-100 border border-white/[0.06]',
      outline:
        'bg-transparent text-white border border-white/15 hover:border-primary/60 hover:text-primary',
      ghost:
        'bg-transparent text-white hover:bg-white/5',
      danger:
        'bg-error text-white hover:bg-error/90',
    }

    const sizes = {
      sm: 'h-10 px-4 text-[13px]',
      md: 'h-11 px-5 text-sm',
      lg: 'h-14 px-7 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(
          // base
          'group relative inline-flex items-center justify-center rounded-xl font-bold uppercase tracking-tightest',
          'transition-[transform,background,box-shadow,border-color] duration-200 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed',
          'active:scale-[0.97] active:duration-75',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </button>
    )
  }
)
Button.displayName = 'Button'
