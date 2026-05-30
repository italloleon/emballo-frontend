import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'gold' | 'success' | 'danger' | 'dim'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-ember/15 text-ember border-ember/30',
  gold: 'bg-gold/15 text-gold border-gold/30',
  success: 'bg-success/15 text-success border-success/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  dim: 'bg-bg-700 text-txt-dim border-bg-600',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
