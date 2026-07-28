import {
  STATUS_META, computeEndISO, fmtShort, parseISO, initials, hexAlpha,
  type PlannerTask, type Member, type PlannerModule,
} from '../../store/usePlannerStore'

export interface KanbanCardProps {
  task:          PlannerTask
  members:       Member[]
  modules:       PlannerModule[]
  onPointerDown: (e: React.PointerEvent) => void
  isFloating?:   boolean
}

export default function KanbanCard({ task, members, modules, onPointerDown, isFloating }: KanbanCardProps) {
  const assignee   = members.find(m => m.id === task.assigneeId)
  const mod        = modules.find(m => m.id === task.moduleId)
  const statusMeta = STATUS_META[task.status]
  const endISO     = computeEndISO(task, members)
  const modColor   = mod?.color || '#94a3b8'

  return (
    <div
      data-card-id={!isFloating ? task.id : undefined}
      onPointerDown={!isFloating ? onPointerDown : undefined}
      className={isFloating ? 'k-card k-floating' : 'k-card'}
    >
      {/* Module pill + status dot */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5">
        <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: hexAlpha(modColor, .13), color: modColor }}>
          {mod?.name || '—'}
        </span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusMeta.dot, flexShrink: 0 }} title={statusMeta.label} />
      </div>

      {/* Title */}
      <div className="text-[13.5px] font-semibold text-slate-800 leading-snug mb-3">
        {task.name || 'Tarea sin título'}
      </div>

      {/* Footer: avatar + date */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-bold text-white shrink-0"
          style={{ background: assignee?.color || '#cbd5e1' }}
          title={assignee?.name}
        >
          {assignee ? initials(assignee.name) : '?'}
        </span>
        {endISO && (
          <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-500">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
            </svg>
            {fmtShort(parseISO(endISO))}
          </span>
        )}
      </div>
    </div>
  )
}
