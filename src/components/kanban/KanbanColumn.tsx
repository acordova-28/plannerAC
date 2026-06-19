import { useDroppable } from '@dnd-kit/core'
import { ComputedTask, Estado } from '../../types'
import KanbanCard from './KanbanCard'

const COLUMN_CONFIG: Record<Estado, { label: string; color: string; bg: string }> = {
  [Estado.Pendiente]:  { label: 'Pendiente',   color: 'border-blue-400',   bg: 'bg-blue-50' },
  [Estado.EnProgreso]: { label: 'En progreso', color: 'border-amber-400',  bg: 'bg-amber-50' },
  [Estado.Completado]: { label: 'Completado',  color: 'border-green-400',  bg: 'bg-green-50' },
  [Estado.Bloqueado]:  { label: 'Bloqueado',   color: 'border-red-400',    bg: 'bg-red-50' },
}

interface Props {
  estado: Estado
  tasks:  ComputedTask[]
}

export default function KanbanColumn({ estado, tasks }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: estado })
  const cfg                    = COLUMN_CONFIG[estado]
  const totalHoras             = tasks.reduce((s, t) => s + (t.horas ?? 0), 0)

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border-t-4 ${cfg.color} ${cfg.bg} border-x border-slate-200`}>
        <div>
          <span className="text-sm font-bold text-slate-700">{cfg.label}</span>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {tasks.length} tareas{totalHoras > 0 ? ` · ${totalHoras}h` : ''}
          </div>
        </div>
        <span className="bg-white text-slate-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border border-slate-200">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 border-x border-b border-slate-200 rounded-b-xl overflow-y-auto space-y-2 min-h-[120px] transition-colors
          ${isOver ? 'bg-blue-50 border-blue-300' : 'bg-slate-50'}`}
      >
        {tasks.map(task => <KanbanCard key={task.id} task={task} />)}

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-slate-300 select-none">
            Arrastra tareas aquí
          </div>
        )}
      </div>
    </div>
  )
}
