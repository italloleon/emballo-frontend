function readApiUrl(): string {
  const url = import.meta.env.VITE_API_URL
  if (!url) {
    throw new Error('VITE_API_URL is required. Copy .env.example to .env and set the API URL.')
  }
  return url
}

export const env = {
  get apiUrl() {
    return readApiUrl()
  },
  allowRegistration: import.meta.env.VITE_ALLOW_REGISTRATION === 'true',
  /** Off only when explicitly set to "false" (e.g. fair build without social demo). */
  enableSocial: import.meta.env.VITE_ENABLE_SOCIAL !== 'false',
}
