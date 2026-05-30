import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Trophy, Flame, Gift } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-900 flex flex-col">
      {/* Ember gradient top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(244,99,42,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <span
          className="text-2xl font-black uppercase tracking-tight text-ember"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          GymLeague
        </span>
        <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
          Entrar
        </Button>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto w-full">
        <div className="mb-4 inline-flex items-center gap-2 bg-ember/10 border border-ember/30 rounded-full px-4 py-1.5 text-ember text-sm font-medium">
          <Flame size={14} />
          Gamificação para academias
        </div>

        <h1
          className="text-6xl sm:text-8xl font-black uppercase text-txt leading-none tracking-tight mb-6"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          TRANSFORME SEU{' '}
          <span className="text-ember">TREINO</span> EM{' '}
          <span className="text-ember">COMPETIÇÃO</span>
        </h1>

        <p className="text-txt-dim text-lg max-w-xl mb-10 leading-relaxed">
          Ligas mensais, streaks de treino e prêmios reais para manter seus alunos motivados.
          A plataforma de gamificação feita para academias brasileiras.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={() => navigate('/register')}>
            Registrar Academia
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate('/login')}>
            Entrar
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: <Trophy size={24} className="text-gold" />,
              title: 'Liga Mensal',
              desc: 'Rankings ao vivo entre alunos da academia. Quem treina mais, sobe no ranking.',
            },
            {
              icon: <Flame size={24} className="text-ember" />,
              title: 'Streak de Treinos',
              desc: 'Recompense a consistência. Cada dia de treino conta para manter a chama acesa.',
            },
            {
              icon: <Gift size={24} className="text-info" />,
              title: 'Prêmios',
              desc: 'Troque pontos por prêmios reais. Crie recompensas customizadas para sua academia.',
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-bg-800 border border-bg-600 rounded-xl p-6 hover:border-bg-600 transition-colors"
            >
              <div className="mb-4">{icon}</div>
              <h3
                className="text-lg font-black uppercase text-txt mb-2"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                {title}
              </h3>
              <p className="text-txt-dim text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-bg-700 py-6 text-center text-txt-faint text-sm">
        © 2025 GymLeague. Todos os direitos reservados.
      </footer>
    </div>
  )
}
