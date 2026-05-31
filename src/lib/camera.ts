function patchVideoPlay(video: HTMLVideoElement) {
  const patched = video as HTMLVideoElement & { __playPatched?: boolean }
  if (patched.__playPatched) return
  const play = video.play.bind(video)
  video.play = () => play().catch(() => undefined)
  patched.__playPatched = true
}

/** Stops all active camera streams (e.g. on route leave). */
export function stopAllCameraStreams() {
  document.querySelectorAll('video').forEach(video => {
    patchVideoPlay(video)
    const src = video.srcObject
    if (src instanceof MediaStream) {
      src.getTracks().forEach((track: MediaStreamTrack) => track.stop())
    }
    video.srcObject = null
  })
}
