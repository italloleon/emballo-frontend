import type { Role } from '@/store/auth'

const STUDENT_TITLES: Record<string, string> = {
  '/student/home': 'Home',
  '/student/feed': 'Feed',
  '/student/league': 'Liga',
  '/student/checkin': 'Check-in',
  '/student/training': 'Treino',
  '/student/calendar': 'Calendário',
  '/student/history': 'Histórico',
  '/student/profile': 'Perfil',
  '/student/prizes': 'Prêmios',
}

const ADMIN_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/feed': 'Feed',
  '/admin/students': 'Alunos',
  '/admin/instructors': 'Instrutores',
  '/admin/leagues': 'Ligas',
  '/admin/prizes': 'Prêmios',
  '/admin/machines': 'Aparelhos',
  '/admin/qrcodes': 'QR Codes',
  '/admin/settings': 'Configurações',
  '/admin/training-plans/generate': 'Gerar treino',
}

const INSTRUCTOR_TITLES: Record<string, string> = {
  '/instructor/dashboard': 'Dashboard',
  '/instructor/feed': 'Feed',
  '/instructor/training-plans': 'Planos de treino',
  '/instructor/training-plans/new': 'Novo plano',
  '/instructor/training-plans/generate': 'Gerar treino',
  '/instructor/students': 'Alunos',
}

function matchTitle(pathname: string, map: Record<string, string>, fallback: string): string {
  if (map[pathname]) return map[pathname]

  if (pathname.startsWith('/admin/students/') && pathname.endsWith('/calendar')) {
    return 'Calendário do aluno'
  }
  if (pathname.startsWith('/admin/students/')) return 'Detalhe do aluno'
  if (pathname.startsWith('/admin/instructors/')) return 'Detalhe do instrutor'
  if (pathname.startsWith('/admin/leagues/')) return 'Detalhe da liga'
  if (pathname.startsWith('/admin/machines/')) return 'Detalhe do aparelho'
  if (pathname.startsWith('/instructor/training-plans/')) return 'Plano de treino'
  if (pathname.startsWith('/instructor/students/') && pathname.endsWith('/calendar')) {
    return 'Calendário do aluno'
  }
  if (pathname.startsWith('/instructor/students/')) return 'Detalhe do aluno'

  return fallback
}

export function getRouteTitle(pathname: string, role: Role | undefined): string {
  switch (role) {
    case 'student':
      return matchTitle(pathname, STUDENT_TITLES, 'GymLeague')
    case 'admin':
      return matchTitle(pathname, ADMIN_TITLES, 'Admin')
    case 'instructor':
      return matchTitle(pathname, INSTRUCTOR_TITLES, 'Instrutor')
    default:
      return 'GymLeague'
  }
}
