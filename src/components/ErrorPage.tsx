import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export default function ErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  let message = 'Algo deu errado.'
  let detail = 'Tente recarregar a página ou volte para o início.'

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      message = 'Página não encontrada.'
      detail = 'O endereço que você tentou acessar não existe.'
    } else {
      message = `Erro ${error.status}`
      detail = error.statusText
    }
  } else if (error instanceof Error) {
    detail = error.message
  }

  return (
    <div className="min-h-screen bg-bg-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center mx-auto">
          <AlertTriangle size={28} className="text-danger" />
        </div>

        <div>
          <h1
            className="text-3xl font-black uppercase text-txt mb-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {message}
          </h1>
          <p className="text-sm text-txt-dim">{detail}</p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-txt-dim bg-bg-800 border border-bg-600 rounded-lg hover:border-bg-500 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-medium text-white bg-ember rounded-lg hover:bg-ember-hover transition-colors"
          >
            Ir para o início
          </button>
        </div>
      </div>
    </div>
  )
}
