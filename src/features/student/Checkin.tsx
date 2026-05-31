import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, CheckCircle2, X, Keyboard } from 'lucide-react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { QrScanner } from '@/components/QrScanner'
import { stopAllCameraStreams } from '@/lib/camera'
import { submitCheckIn } from '@/api/checkins'
import { getMyPoints } from '@/api/users'
import { parseCheckInToken } from '@/lib/qr'
import { unwrapList } from '@/lib/utils'

type State = 'idle' | 'success' | 'error' | 'manual'

function checkInErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const status = err.response?.status
    const msg = err.response?.data?.message as string | undefined
    if (status === 409) return 'Você já fez check-in neste local hoje.'
    if (status === 422) return msg ?? 'QR Code inválido ou inativo.'
    if (status === 404) return 'Perfil de aluno não encontrado.'
    if (msg) return msg
  }
  if (err instanceof Error && err.message.includes('aluno')) return err.message
  return 'Não foi possível registrar o check-in. Tente novamente.'
}

async function fetchLatestCheckInPoints(retries = 3): Promise<number> {
  for (let i = 0; i < retries; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 400))
    try {
      const { data } = await getMyPoints()
      const paginated = data?.transactions
      const txs = unwrapList<{ points: number; source_type?: string }>(
        paginated?.data ?? paginated ?? data
      )
      const checkInTx = txs.find(t => t.source_type === 'check_in') ?? txs[0]
      if (checkInTx?.points) return checkInTx.points
    } catch {
      // retry
    }
  }
  return 0
}

export default function StudentCheckin() {
  const navigate = useNavigate()
  const [state, setState] = useState<State>('idle')
  const [points, setPoints] = useState(0)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualToken, setManualToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const processingRef = useRef(false)

  const processToken = useCallback(async (raw: string) => {
    if (processingRef.current) return
    const token = parseCheckInToken(raw)
    if (!token) {
      toast.error('QR Code não reconhecido.')
      return
    }

    processingRef.current = true
    setSubmitting(true)
    try {
      await submitCheckIn(token)
      const earned = await fetchLatestCheckInPoints()
      setPoints(earned > 0 ? earned : 10)
      setState('success')
      toast.success('Check-in realizado!')
    } catch (err) {
      setState('error')
      toast.error(checkInErrorMessage(err))
    } finally {
      processingRef.current = false
      setSubmitting(false)
    }
  }, [])

  const handleScan = useCallback(
    (text: string) => {
      void processToken(text)
    },
    [processToken]
  )

  const handleCameraError = useCallback((msg: string) => {
    setCameraError(msg)
  }, [])

  useEffect(() => {
    if (state !== 'idle') return
    processingRef.current = false
  }, [state])

  useEffect(() => () => stopAllCameraStreams(), [])

  function reset() {
    processingRef.current = false
    setState('idle')
    setPoints(0)
    setManualToken('')
    setCameraError(null)
  }

  if (state === 'success') {
    return (
      <div className="max-w-sm mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <style>{`
          @keyframes pop-in {
            0% { transform: scale(0) rotate(-10deg); opacity: 0; }
            70% { transform: scale(1.15) rotate(3deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          @keyframes float-up {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-40px); opacity: 0; }
          }
          .pop-in { animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
          .dot-1 { animation: float-up 1.2s 0.3s ease-out forwards; }
          .dot-2 { animation: float-up 1.2s 0.5s ease-out forwards; }
          .dot-3 { animation: float-up 1.2s 0.4s ease-out forwards; }
        `}</style>

        <div className="relative">
          <div className="absolute -top-4 -left-4 w-3 h-3 bg-gold rounded-full dot-1" />
          <div className="absolute -top-6 left-8 w-2 h-2 bg-ember rounded-full dot-2" />
          <div className="absolute -top-3 right-0 w-3 h-3 bg-success rounded-full dot-3" />
          <div className="w-24 h-24 bg-success/10 border-2 border-success/30 rounded-full flex items-center justify-center pop-in">
            <CheckCircle2 size={48} className="text-success" />
          </div>
        </div>

        <div>
          <h2
            className="text-3xl font-black uppercase text-txt mb-1"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            Check-in Feito!
          </h2>
          <p className="text-txt-dim text-sm">Boa treino! Você ganhou</p>
          <p
            className="text-4xl font-bold text-success mt-1"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            +{points} pts
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <Button variant="secondary" className="flex-1" onClick={() => navigate('/student/home')}>
            Ir para Home
          </Button>
          <Button className="flex-1" onClick={reset}>
            Novo Check-in
          </Button>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="max-w-sm mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-danger/10 border-2 border-danger/30 rounded-full flex items-center justify-center">
          <X size={48} className="text-danger" />
        </div>
        <div>
          <h2
            className="text-3xl font-black uppercase text-txt mb-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            Erro no Check-in
          </h2>
          <p className="text-txt-dim text-sm">QR inválido, inativo ou check-in já feito hoje neste local.</p>
        </div>
        <Button className="w-full" onClick={reset}>
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (state === 'manual') {
    return (
      <div className="max-w-sm mx-auto space-y-6">
        <div>
          <h1
            className="text-2xl font-black uppercase text-txt"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            Código manual
          </h1>
          <p className="text-txt-dim text-xs mt-0.5">
            Cole o token exibido no QR da academia
          </p>
        </div>
        <Input
          label="Token do QR Code"
          placeholder="Cole o código aqui"
          value={manualToken}
          onChange={e => setManualToken(e.target.value)}
        />
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setState('idle')}>
            Voltar
          </Button>
          <Button
            className="flex-1"
            loading={submitting}
            disabled={!manualToken.trim()}
            onClick={() => void processToken(manualToken)}
          >
            Confirmar
          </Button>
        </div>
      </div>
    )
  }

  const scanning = state === 'idle'

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Check-in
        </h1>
        <p className="text-txt-dim text-xs mt-0.5">Aponte para o QR Code da academia</p>
      </div>

      <div className="relative w-full aspect-square bg-bg-800 border border-bg-600 rounded-2xl overflow-hidden">
        <div className="absolute top-4 left-4 w-8 h-8 border-t-[3px] border-l-[3px] border-ember rounded-tl-lg z-10 pointer-events-none" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-[3px] border-r-[3px] border-ember rounded-tr-lg z-10 pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-[3px] border-l-[3px] border-ember rounded-bl-lg z-10 pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-[3px] border-r-[3px] border-ember rounded-br-lg z-10 pointer-events-none" />

        {scanning && !cameraError ? (
          <QrScanner
            paused={submitting}
            onScan={handleScan}
            onError={handleCameraError}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <QrCode size={48} className="text-txt-faint" />
            <p className="text-xs text-txt-faint">
              {cameraError ?? 'Câmera indisponível.'}
            </p>
          </div>
        )}

        {submitting && (
          <div className="absolute inset-0 bg-bg-900/70 flex items-center justify-center z-20">
            <p className="text-sm text-txt font-medium">Registrando check-in…</p>
          </div>
        )}
      </div>

      {cameraError && scanning && (
        <Button variant="secondary" className="w-full" onClick={() => setState('manual')}>
          <Keyboard size={16} />
          Inserir código manualmente
        </Button>
      )}

      {!cameraError && (
        <Button variant="ghost" className="w-full" size="sm" onClick={() => setState('manual')}>
          <Keyboard size={16} />
          Inserir código manualmente
        </Button>
      )}

      <p className="text-center text-xs text-txt-faint">
        Escaneie o QR afixado na entrada ou na área de treino
      </p>
    </div>
  )
}
