import { useState, useCallback } from 'react'
import { cheerUser } from '@/api/users'

interface CheerButtonProps {
  targetUserId: string
  targetUserName: string
  onCheer?: () => void
}

type CheerState = 'idle' | 'loading' | 'done' | 'error'

export function CheerButton({ targetUserId, onCheer }: CheerButtonProps) {
  const [state, setState] = useState<CheerState>('idle')
  const [animKey, setAnimKey] = useState(0)

  const handleClick = useCallback(async () => {
    if (state === 'loading' || state === 'done') return
    setState('loading')

    try {
      await cheerUser(targetUserId)
      setAnimKey((k) => k + 1)
      setState('done')
      onCheer?.()
    } catch (err: unknown) {
      const status =
        err != null &&
        typeof err === 'object' &&
        'response' in err &&
        err.response != null &&
        typeof err.response === 'object' &&
        'status' in err.response
          ? (err.response as { status: number }).status
          : null

      if (status === 409) {
        // already cheered today — treat as success
        setAnimKey((k) => k + 1)
        setState('done')
        onCheer?.()
      } else {
        setState('error')
        setTimeout(() => setState('idle'), 2000)
      }
    }
  }, [state, targetUserId, onCheer])

  if (state === 'loading') {
    return (
      <button
        disabled
        className="flex items-center gap-1 focus:outline-none transition-colors"
        aria-label="Enviando palma…"
      >
        <span className="w-3 h-3 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-txt-faint text-xs">Animando…</span>
      </button>
    )
  }

  if (state === 'done') {
    return (
      <button
        disabled
        className="flex items-center gap-1 focus:outline-none transition-colors"
        aria-label="Palma enviada"
      >
        <span key={animKey} className="cheer-burst">👏</span>
        <span className="text-gold text-xs">Animado!</span>
      </button>
    )
  }

  if (state === 'error') {
    return (
      <button
        disabled
        className="flex items-center gap-1 focus:outline-none transition-colors"
        aria-label="Erro ao enviar palma"
      >
        <span>👏</span>
        <span className="text-danger text-xs">Tente novamente</span>
      </button>
    )
  }

  // idle
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 focus:outline-none transition-colors"
      aria-label="Animar este aluno"
    >
      <span key={animKey}>👏</span>
      <span className="text-txt-faint text-xs">Animar</span>
    </button>
  )
}
