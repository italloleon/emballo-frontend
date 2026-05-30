import { NavLink } from 'react-router-dom'
import { Home, Trophy, QrCode, User, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/student/home', label: 'Home', icon: Home },
  { to: '/student/calendar', label: 'Treino', icon: Calendar },
  { to: '/student/checkin', label: 'Check-in', icon: QrCode },
  { to: '/student/league', label: 'Liga', icon: Trophy },
  { to: '/student/profile', label: 'Perfil', icon: User },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-bg-800 border-t border-bg-600 pb-safe">
      <div className="flex items-stretch h-16">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors',
                isActive ? 'text-ember' : 'text-txt-faint hover:text-txt-dim'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  className={cn(isActive && 'drop-shadow-[0_0_6px_rgba(244,99,42,0.6)]')}
                />
                <span className="font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
