import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ClipboardList, ArrowRight, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/auth'
import { getStudents } from '@/api/users'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'BOM DIA'
  if (h < 18) return 'BOA TARDE'
  return 'BOA NOITE'
}

export default function InstructorDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [studentCount, setStudentCount] = useState<number | null>(null)

  useEffect(() => {
    async function fetchStudentCount() {
      try {
        const { data } = await getStudents()
        const list = Array.isArray(data) ? data : (data?.data ?? [])
        setStudentCount(list.length)
      } catch {
        setStudentCount(0)
      }
    }
    fetchStudentCount()
  }, [])

  const stats: Array<{
    label: string
    value: string | number
    icon: React.ReactNode
    onClick?: () => void
  }> = [
    {
      label: 'Alunos Ativos',
      value: studentCount ?? '—',
      icon: <Users size={18} className="text-info" />,
      onClick: () => navigate('/instructor/students'),
    },
    {
      label: 'Planos Criados',
      value: '—',
      icon: <ClipboardList size={18} className="text-ember" />,
      onClick: () => navigate('/instructor/training-plans'),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          {getGreeting()},{' '}
          <span className="text-ember">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-txt-dim text-sm mt-0.5">Painel do instrutor</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map(s => {
          const Tag = s.onClick ? 'button' : 'div'
          return (
          <Tag
            key={s.label}
            type={s.onClick ? 'button' : undefined}
            className={`bg-bg-800 rounded-xl border border-bg-600 p-5 text-left w-full ${s.onClick ? 'cursor-pointer hover:border-ember/40 transition-colors' : ''}`}
            onClick={s.onClick}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-txt-dim uppercase tracking-wider leading-tight">
                {s.label}
              </span>
              {s.icon}
            </div>
            <p
              className="text-3xl font-bold text-txt"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {s.value}
            </p>
          </Tag>
          )
        })}
      </div>

      {/* Activity Feed */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-black uppercase text-txt"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            Atividade Recente
          </h2>
        </div>
        <p className="text-sm text-txt-dim">Nenhuma atividade recente.</p>
      </Card>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/instructor/training-plans/generate')}
          className="flex items-center justify-between p-4 bg-bg-800 border border-ember/20 rounded-xl hover:border-ember/40 transition-colors text-left"
        >
          <div>
            <p className="text-sm font-semibold text-txt flex items-center gap-1.5">
              <Sparkles size={14} className="text-ember" />
              Gerar Treino com IA
            </p>
            <p className="text-xs text-txt-faint mt-0.5">Crie um plano personalizado automaticamente</p>
          </div>
          <ArrowRight size={16} className="text-txt-faint" />
        </button>
        <button
          onClick={() => navigate('/instructor/training-plans/new')}
          className="flex items-center justify-between p-4 bg-bg-800 border border-bg-600 rounded-xl hover:border-ember/30 transition-colors text-left"
        >
          <div>
            <p className="text-sm font-semibold text-txt">Novo Plano Manual</p>
            <p className="text-xs text-txt-faint mt-0.5">Monte um plano exercício a exercício</p>
          </div>
          <ArrowRight size={16} className="text-txt-faint" />
        </button>
        <button
          onClick={() => navigate('/instructor/students')}
          className="flex items-center justify-between p-4 bg-bg-800 border border-bg-600 rounded-xl hover:border-ember/30 transition-colors text-left sm:col-span-2"
        >
          <div>
            <p className="text-sm font-semibold text-txt">Ver Alunos</p>
            <p className="text-xs text-txt-faint mt-0.5">Gerencie seus alunos</p>
          </div>
          <ArrowRight size={16} className="text-txt-faint" />
        </button>
      </div>
    </div>
  )
}
