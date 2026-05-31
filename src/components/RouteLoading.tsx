export function RouteLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-bg-900">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-ember border-t-transparent"
        role="status"
        aria-label="Carregando"
      />
    </div>
  )
}
