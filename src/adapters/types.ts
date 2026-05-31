export interface TokenProvider {
  getToken(): string | null
  setToken(token: string | null): void
}

export interface NavigationAdapter {
  redirectToLogin(): void
}

export interface NotificationAdapter {
  error(message: string): void
}

export interface ApiAdapters {
  tokenProvider: TokenProvider
  navigation: NavigationAdapter
  notifications: NotificationAdapter
}

export interface CreateApiClientOptions extends ApiAdapters {
  baseURL: string
}
