import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'
import { createPost, type PostEntry } from '@/api/feed'

interface PostComposerProps {
  onPost: (post: PostEntry) => void
}

export function PostComposer({ onPost }: PostComposerProps) {
  const { user } = useAuthStore()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user || user.role === 'student') return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const res = await createPost({ body: trimmed })
      onPost(res.data)
      setBody('')
    } catch {
      setError('Não foi possível publicar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg-800 border border-bg-600 rounded-xl p-4">
      {error && (
        <div className="mb-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Escreva um comunicado para a academia..."
        rows={3}
        maxLength={1000}
        className="w-full bg-transparent text-sm text-txt placeholder:text-txt-faint resize-none outline-none"
      />
      <div className="flex items-center justify-between mt-3 border-t border-bg-600 pt-3">
        <span className="text-xs text-txt-faint">{body.length}/1000</span>
        <Button size="sm" type="submit" loading={loading} disabled={!body.trim()}>
          <Send size={14} />
          Publicar
        </Button>
      </div>
    </form>
  )
}
