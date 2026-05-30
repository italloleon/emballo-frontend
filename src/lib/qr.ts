/** Payload encoded in printed / on-screen gym QR codes. */
export function buildCheckInQrPayload(token: string): string {
  return `gymleague://checkin?token=${encodeURIComponent(token)}`
}

/** Extract API token from scanned QR text (URL, JSON, or raw token). */
export function parseCheckInToken(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as { token?: string; qr_token?: string }
      return parsed.token ?? parsed.qr_token ?? null
    } catch {
      return null
    }
  }

  if (trimmed.includes('://') || trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed)
      const fromQuery = url.searchParams.get('token') ?? url.searchParams.get('qr_token')
      if (fromQuery) return fromQuery
      const pathToken = url.pathname.split('/').filter(Boolean).pop()
      if (pathToken && pathToken.length >= 16) return pathToken
    } catch {
      // fall through to raw token
    }
  }

  return trimmed
}
