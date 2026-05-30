import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  LayoutDashboard,
  Users,
  Trophy,
  Gift,
  Dumbbell,
  QrCode,
  Settings,
  LogOut,
  ClipboardList,
  UserCheck,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useAcademyStore } from '@/store/academy'
import { cn } from '@/lib/utils'
import * as authApi from '@/api/auth'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const adminNav: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/feed', label: 'Feed', icon: <Activity size={18} /> },
  { to: '/admin/students', label: 'Alunos', icon: <Users size={18} /> },
  { to: '/admin/instructors', label: 'Instrutores', icon: <UserCheck size={18} /> },
  { to: '/admin/leagues', label: 'Ligas', icon: <Trophy size={18} /> },
  { to: '/admin/prizes', label: 'Prêmios', icon: <Gift size={18} /> },
  { to: '/admin/machines', label: 'Aparelhos', icon: <Dumbbell size={18} /> },
  { to: '/admin/qrcodes', label: 'QR Codes', icon: <QrCode size={18} /> },
  { to: '/admin/settings', label: 'Configurações', icon: <Settings size={18} /> },
]

const instructorNav: NavItem[] = [
  { to: '/instructor/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/instructor/feed', label: 'Feed', icon: <Activity size={18} /> },
  { to: '/instructor/training-plans', label: 'Planos de Treino', icon: <ClipboardList size={18} /> },
  { to: '/instructor/students', label: 'Alunos', icon: <Users size={18} /> },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const { academy } = useAcademyStore()
  const navigate = useNavigate()

  const navItems = user?.role === 'admin' ? adminNav : instructorNav

  async function handleLogout() {
    try {
      await authApi.logout()
    } finally {
      logout()
      navigate('/login', { replace: true })
    }
  }

  function handleNavClick() {
    onMobileClose?.()
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'flex flex-col w-60 bg-bg-800 border-r border-bg-600 h-svh z-50',
          'fixed inset-y-0 left-0 transition-transform duration-200 ease-out lg:static lg:shrink-0 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
      <div className="px-5 py-6 border-b border-bg-600">
        <p className="text-xs font-medium text-txt-faint uppercase tracking-widest mb-1">Academia</p>
        <p className="text-sm font-semibold text-txt truncate">{academy?.name ?? 'GymLeague'}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-ember/10 text-ember font-medium'
                  : 'text-txt-dim hover:text-txt hover:bg-bg-700'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-bg-600">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-txt-dim truncate">{user?.name}</p>
          <p className="text-xs text-txt-faint truncate">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-txt-dim hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
    </>
  )
}
