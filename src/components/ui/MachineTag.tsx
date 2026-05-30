import { Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface MachineTagProps {
  name: string
  className?: string
}

export function MachineTag({ name, className }: MachineTagProps) {
  return (
    <Badge variant="dim" className={className}>
      <Wrench size={10} className="mr-0.5 shrink-0" />
      {name}
    </Badge>
  )
}
