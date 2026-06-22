import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ComputedTask } from '@wuolla/shared'
import { useTaskStore } from '../../store/useTaskStore'
import Badge from '../shared/PriorityBadge'

interface Props { task: ComputedTask }

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function KanbanCard({ task }: Props) {
  const setActiveTask = useTaskStore(s => s.setActiveTask)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity:   isDragging ? 0.4 : 1,
    cursor:    isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow select-none"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] font-bold text-[#1A5276] font-mono">{task.id}</span>
        <Badge type="prioridad" value={task.prioridad} />
      </div>

      {/* Task name */}
      <p
        className="text-xs text-slate-700 leading-snug mb-2.5 cursor-pointer hover:text-[#1A5276] transition-colors"
        onClick={e => { e.stopPropagation(); setActiveTask(task.id) }}
        onPointerDown={e => e.stopPropagation()}
      >
        {task.tarea}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {task.tipo && <Badge type="tipo" value={task.tipo} />}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {task.horas && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
              {task.horas}h
            </span>
          )}
          {task.responsable && (
            <div
              title={task.responsable}
              className="w-6 h-6 rounded-full bg-[#1A5276] text-white text-[9px] font-bold flex items-center justify-center shrink-0"
            >
              {initials(task.responsable)}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {task.porcentajeReal > 0 && (
        <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${task.porcentajeReal}%` }}
          />
        </div>
      )}
    </div>
  )
}
