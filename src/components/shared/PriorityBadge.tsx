import { Prioridad, Tipo, Estado } from '../../types'

const PRIORIDAD_STYLES: Record<Prioridad, string> = {
  [Prioridad.Alta]:  'bg-red-100 text-red-800',
  [Prioridad.Media]: 'bg-yellow-100 text-yellow-800',
  [Prioridad.Baja]:  'bg-green-100 text-green-800',
}

const TIPO_STYLES: Record<Tipo, string> = {
  [Tipo.Frontend]:  'bg-purple-100 text-purple-800',
  [Tipo.Backend]:   'bg-orange-100 text-orange-800',
  [Tipo.FrontBack]: 'bg-teal-100 text-teal-800',
  [Tipo.SinTipo]:   'bg-slate-100 text-slate-500',
}

const ESTADO_STYLES: Record<Estado, string> = {
  [Estado.Pendiente]:  'bg-blue-100 text-blue-800',
  [Estado.EnProgreso]: 'bg-amber-100 text-amber-800',
  [Estado.Completado]: 'bg-green-100 text-green-800',
  [Estado.Bloqueado]:  'bg-red-100 text-red-800',
}

interface Props {
  type:  'prioridad' | 'tipo' | 'estado'
  value: Prioridad | Tipo | Estado
}

export default function Badge({ type, value }: Props) {
  let cls = ''
  if (type === 'prioridad') cls = PRIORIDAD_STYLES[value as Prioridad]
  if (type === 'tipo')      cls = TIPO_STYLES[value as Tipo]
  if (type === 'estado')    cls = ESTADO_STYLES[value as Estado]

  if (!value) return <span className="text-slate-400 text-xs">—</span>

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${cls}`}>
      {value}
    </span>
  )
}
