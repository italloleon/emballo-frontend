import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, Building2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/auth'
import { useAcademyStore } from '@/store/academy'
import * as authApi from '@/api/auth'
import { getMe, getMyNotifications } from '@/api/users'
import { getInitials, getStreakDays } from '@/lib/utils'
import { parseMeDashboard, type MeDashboard } from '@/lib/meDashboard'

type CheerNotif = {
  id: string
  type: 'cheer_received'
  read: boolean
  created_at: string
  data: {
    cheer_id: string
    sender: { user_id: string; name: string }
    sent_on: string
  }
}

function formatRelative(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) return `há ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days} dias`
}

export default function StudentProfile() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { academy } = useAcademyStore()
  const [stats, setStats] = useState<MeDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cheerNotifs, setCheerNotifs] = useState<CheerNotif[]>([])

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await getMe()
        setStats(parseMeDashboard(data))
      } catch {
        setError('Não foi possível carregar os dados.')
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const { data } = await getMyNotifications()
        const notifs = Array.isArray(data) ? data : (data?.notifications ?? [])
        setCheerNotifs(
          (notifs as CheerNotif[]).filter((n) => n.type === 'cheer_received'),
        )
      } catch {
        // silently swallow — secondary data
      }
    }
    fetchNotifications()
  }, [])

  async function handleLogout() {
    try {
      await authApi.logout()
    } finally {
      logout()
      navigate('/login', { replace: true })
    }
  }

  if (!user) return null

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1
        className="text-2xl font-black uppercase text-txt"
        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
      >
        Perfil
      </h1>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Avatar + Info */}
      <Card>
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-20 h-20 rounded-full bg-ember/10 border-2 border-ember/30 flex items-center justify-center text-2xl font-bold text-ember mb-3">
            {getInitials(user.name)}
          </div>
          <h2
            className="text-xl font-black uppercase text-txt"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {user.name}
          </h2>
          <Badge variant="default" className="mt-2">Aluno</Badge>
        </div>

        <div className="mt-4 space-y-3 pt-4 border-t border-bg-700">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={15} className="text-txt-faint shrink-0" />
            <span className="text-txt-dim truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Building2 size={15} className="text-txt-faint shrink-0" />
            <span className="text-txt-dim">{academy?.name ?? 'Academia GymLeague'}</span>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Streak Atual', value: `🔥 ${getStreakDays(stats?.streak)}d` },
          { label: 'Posição na Liga', value: `#${stats?.leagueRank ?? '—'}` },
          { label: 'Pontos', value: `${stats?.totalPoints ?? 0}` },
          { label: 'Total Check-ins', value: `${stats?.totalCheckIns ?? 0}` },
          { label: 'Palmas', value: `👏 ${stats?.cheerCount ?? 0}` },
        ].map(s => (
          <div key={s.label} className="bg-bg-800 border border-bg-600 rounded-xl p-4 text-center">
            <p
              className="text-xl font-bold text-txt mb-0.5"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {s.value}
            </p>
            <p className="text-xs text-txt-faint">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Received cheers notifications */}
      {cheerNotifs.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-txt mb-3">Palmas Recebidas 👏</h3>
          <div className="space-y-2">
            {cheerNotifs.map((notif) => (
              <div key={notif.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-xs font-bold text-gold shrink-0">
                  {getInitials(notif.data.sender.name)}
                </div>
                <span className="text-sm text-txt flex-1 truncate">
                  {notif.data.sender.name}
                </span>
                <span className="text-xs text-txt-faint shrink-0">
                  {formatRelative(notif.created_at)}
                </span>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Logout */}
      <Button
        variant="danger"
        className="w-full"
        size="lg"
        onClick={handleLogout}
      >
        <LogOut size={18} />
        Sair da Conta
      </Button>
    </div>
  )
}
