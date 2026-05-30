import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QrScannerProps {
  onScan: (decodedText: string) => void
  onError?: (message: string) => void
  paused?: boolean
}

function captureStream(elementId: string): MediaStream | null {
  const video = document.getElementById(elementId)?.querySelector('video')
  const src = video?.srcObject
  return src instanceof MediaStream ? src : null
}

function patchVideoPlay(video: HTMLVideoElement) {
  const patched = video as HTMLVideoElement & { __playPatched?: boolean }
  if (patched.__playPatched) return
  const play = video.play.bind(video)
  video.play = () => play().catch(() => undefined)
  patched.__playPatched = true
}

function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return
  stream.getTracks().forEach(track => track.stop())
}

function detachVideo(elementId: string) {
  const video = document.getElementById(elementId)?.querySelector('video')
  if (!video) return
  patchVideoPlay(video)
  video.srcObject = null
}

async function releaseScanner(scanner: Html5Qrcode) {
  try {
    await scanner.stop()
  } catch {
    // stop() throws if start() has not finished yet
  }
  try {
    scanner.clear()
  } catch {
    // ignore
  }
}

export function QrScanner({ onScan, onError, paused = false }: QrScannerProps) {
  const elementId = useId().replace(/:/g, '')
  const [ready, setReady] = useState(false)
  const lastScanRef = useRef('')
  const streamRef = useRef<MediaStream | null>(null)
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)

  onScanRef.current = onScan
  onErrorRef.current = onError

  useEffect(() => {
    if (paused) {
      return () => {
        stopMediaStream(streamRef.current)
        streamRef.current = null
      }
    }

    let cancelled = false
    const scanner = new Html5Qrcode(elementId)
    streamRef.current = null

    const streamPoll = globalThis.setInterval(() => {
      if (streamRef.current) return
      const stream = captureStream(elementId)
      if (stream) streamRef.current = stream
    }, 50)

    const container = document.getElementById(elementId)
    const observer =
      container &&
      new MutationObserver(() => {
        const video = container.querySelector('video')
        if (video) patchVideoPlay(video)
      })
    if (observer && container) observer.observe(container, { childList: true, subtree: true })

    const shutdown = () => {
      if (observer) observer.disconnect()
      clearInterval(streamPoll)
      const stream = streamRef.current ?? captureStream(elementId)
      stopMediaStream(stream)
      detachVideo(elementId)
      streamRef.current = null
    }

    const startPromise = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        decodedText => {
          if (cancelled) return
          if (decodedText === lastScanRef.current) return
          lastScanRef.current = decodedText
          onScanRef.current(decodedText)
        },
        () => {}
      )
      .then(() => {
        const stream = captureStream(elementId)
        if (stream) streamRef.current = stream

        if (cancelled) {
          shutdown()
          return releaseScanner(scanner)
        }
        setReady(true)
      })
      .catch(err => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Não foi possível acessar a câmera.'
          onErrorRef.current?.(message)
        }
      })

    return () => {
      cancelled = true
      setReady(false)
      shutdown()
      void startPromise.finally(() => releaseScanner(scanner))
    }
  }, [elementId, paused])

  return (
    <div className="relative w-full h-full min-h-[240px] bg-black">
      <div id={elementId} className="w-full h-full [&_video]:object-cover" />
      {!ready && !paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-900/80">
          <p className="text-xs text-txt-faint">Iniciando câmera…</p>
        </div>
      )}
    </div>
  )
}

export function stopAllCameraStreams() {
  document.querySelectorAll('video').forEach(video => {
    patchVideoPlay(video)
    video.srcObject?.getTracks().forEach(track => track.stop())
    video.srcObject = null
  })
}
