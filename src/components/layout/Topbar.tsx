import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

interface TopbarProps {
  title: string
  showBack?: boolean
  showMenu?: boolean
  onMenuClick?: () => void
  className?: string
}

export function Topbar({ title, showBack = false, showMenu = false, onMenuClick, className }: TopbarProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const initials = user?.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <header
      className={cn(
        'flex items-center justify-between h-14 px-4 md:px-5 border-b border-bg-600 bg-bg-800 shrink-0',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {showMenu && (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-1.5 rounded-lg text-txt-dim hover:text-txt hover:bg-bg-700 transition-colors lg:hidden shrink-0"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
        )}
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-txt-dim hover:text-txt hover:bg-bg-700 transition-colors shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <p className="text-base font-semibold text-txt truncate">{title}</p>
      </div>

      {user && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-txt-dim hidden sm:block">{user.name}</span>
          <div className="w-8 h-8 rounded-full bg-ember/20 border border-ember/40 flex items-center justify-center">
            <span className="text-xs font-semibold text-ember">{initials}</span>
          </div>
        </div>
      )}
    </header>
  )
}
