import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-bg-800 rounded-xl border border-bg-600',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  )
}
