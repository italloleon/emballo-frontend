import { type StreakPayload } from '@/lib/utils'

export interface MeDashboard {
  studentId: string
  streak?: number | StreakPayload
  totalPoints: number
  leagueRank: number | null
  leaguePoints: number
  leagueName: string | null
  totalCheckIns: number
  cheerCount: number
}

/** Maps GET /me/dashboard payload to frontend-friendly fields. */
export function parseMeDashboard(data: Record<string, unknown> | null | undefined): MeDashboard {
  const activeLeague = data?.active_league as Record<string, unknown> | null | undefined

  return {
    studentId: String(data?.student_id ?? ''),
    streak: data?.streak as number | StreakPayload | undefined,
    totalPoints: Number(data?.total_points ?? 0),
    leagueRank: activeLeague?.my_rank != null ? Number(activeLeague.my_rank) : null,
    leaguePoints: Number(activeLeague?.my_points ?? 0),
    leagueName: (activeLeague?.name as string | undefined) ?? null,
    totalCheckIns: Number(data?.total_check_ins ?? 0),
    cheerCount: Number(data?.cheers_received_total ?? 0),
  }
}
