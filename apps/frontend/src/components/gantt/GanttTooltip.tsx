import { ComputedTask } from '@wuolla/shared'
import { formatDate } from '../../utils/dateUtils'
import Badge from '../shared/PriorityBadge'

interface Props {
  task: ComputedTask
  clientX: number
  clientY: number
}

export default function GanttTooltip({ task, clientX, clientY }: Props) {
  return (
    <div
      style={{ position: 'fixed', left: clientX + 14, top: clientY - 8, zIndex: 9999 }}
      className="bg-white border border-slate-200 rounded-xl shadow-2xl p-3.5 text-xs w-64 pointer-events-none"
    >
      <div className="font-bold text-[#1A5276] mb-1">{task.id}</div>
      <div className="text-slate-700 leading-snug mb-2.5 text-[11px]">{task.tarea}</div>

      <div className="space-y-1.5 text-slate-500">
        <Row label="Responsable" value={task.responsable || '—'} />
        <Row label="Horas"       value={task.horas ? `${task.horas}h` : '—'} />
        {task.fechaInicio && <Row label="Inicio" value={formatDate(task.fechaInicio)} />}
        {task.fechaFin    && <Row label="Fin"    value={formatDate(task.fechaFin)} />}
        {task.duracionDias && <Row label="Días"  value={String(task.duracionDias)} />}
        <Row label="Progreso" value={`${task.porcentajeReal}%`} />
      </div>

      <div className="flex gap-1.5 mt-2.5">
        <Badge type="estado"    value={task.estado} />
        <Badge type="prioridad" value={task.prioridad} />
        {task.tipo && <Badge type="tipo" value={task.tipo} />}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="font-semibold">{label}:</span>
      <span className="text-slate-700">{value}</span>
    </div>
  )
}
