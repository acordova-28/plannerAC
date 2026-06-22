import { RefObject } from 'react'
import { ComputedTask } from '@wuolla/shared'
import { GanttLayout } from '../../hooks/useGanttLayout'
import { ROW_HEIGHT, GROUP_ROW_HEIGHT, TIMELINE_HEIGHT, LEFT_PANEL_WIDTH } from '../../constants/gantt'
import { formatDate } from '../../utils/dateUtils'
import { useTaskStore } from '../../store/useTaskStore'
import Badge from '../shared/PriorityBadge'

interface Props {
  tasks:            ComputedTask[]
  layout:           GanttLayout
  collapsedModules: Set<string>
  onToggleModule:   (modulo: string) => void
  bodyRef:          RefObject<HTMLDivElement | null>
  onBodyScroll:     () => void
}

export default function GanttTable({ tasks, layout, collapsedModules, onToggleModule, bodyRef, onBodyScroll }: Props) {
  const setActiveTask = useTaskStore(s => s.setActiveTask)
  const { modules }   = layout

  return (
    <div
      style={{ width: LEFT_PANEL_WIDTH, minWidth: LEFT_PANEL_WIDTH }}
      className="flex flex-col border-r-2 border-slate-200 bg-white"
    >
      {/* Fixed header (same height as timeline) */}
      <div
        style={{ height: TIMELINE_HEIGHT }}
        className="shrink-0 bg-slate-50 border-b-2 border-[#1A5276]/20 flex items-end pb-1 px-3 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
      >
        <span className="w-7 shrink-0">#</span>
        <span className="flex-1 min-w-0">Tarea</span>
        <span className="w-10 text-center shrink-0">Días</span>
        <span className="w-20 text-center shrink-0">Inicio</span>
        <span className="w-20 text-right shrink-0">Fin</span>
      </div>

      {/* Scrollable body */}
      <div
        ref={bodyRef}
        onScroll={onBodyScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden gantt-scroll"
      >
        {modules.map(modulo => {
          const moduleTasks  = tasks.filter(t => t.modulo === modulo)
          const totalH       = moduleTasks.reduce((s, t) => s + (t.horas ?? 0), 0)
          const collapsed    = collapsedModules.has(modulo)
          const firstStart   = moduleTasks.find(t => t.fechaInicio)?.fechaInicio
          const lastEnd      = moduleTasks.slice().reverse().find(t => t.fechaFin)?.fechaFin

          return (
            <div key={modulo}>
              {/* Module row */}
              <div
                style={{ height: GROUP_ROW_HEIGHT }}
                className="flex items-center gap-2 px-3 bg-slate-200 border-b border-slate-300 cursor-pointer hover:bg-slate-300/70 transition-colors select-none"
                onClick={() => onToggleModule(modulo)}
              >
                <span className="text-slate-500 text-xs shrink-0">{collapsed ? '▶' : '▼'}</span>
                <span className="font-bold text-slate-700 text-xs flex-1 min-w-0 truncate">{modulo}</span>
                <span className="text-slate-500 text-[10px] shrink-0">{totalH}h</span>
                {firstStart && (
                  <span className="text-slate-400 text-[10px] shrink-0 hidden xl:block">
                    {formatDate(firstStart)}–{lastEnd ? formatDate(lastEnd) : '?'}
                  </span>
                )}
              </div>

              {/* Task rows */}
              {!collapsed && moduleTasks.map((task, idx) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={idx + 1}
                  onClick={() => setActiveTask(task.id)}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TaskRow({ task, index, onClick }: { task: ComputedTask; index: number; onClick: () => void }) {
  const hasHours = task.horas !== null

  return (
    <div
      style={{ height: ROW_HEIGHT }}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 border-b border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors select-none
        ${!hasHours ? 'opacity-60' : ''}`}
    >
      <span className="w-7 text-[10px] text-slate-400 font-mono shrink-0">{index}</span>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-slate-700 leading-tight truncate" title={task.tarea}>
          {task.tarea}
        </div>
        <div className="flex gap-1 mt-0.5">
          <Badge type="prioridad" value={task.prioridad} />
          {task.tipo && <Badge type="tipo" value={task.tipo} />}
        </div>
      </div>

      <span className="w-10 text-center text-[10px] text-slate-500 shrink-0">
        {task.duracionDias ? `${task.duracionDias}d` : '—'}
      </span>

      <span className="w-20 text-center text-[10px] text-slate-500 shrink-0">
        {task.fechaInicio ? formatDate(task.fechaInicio) : <span className="text-slate-300">—</span>}
      </span>

      <span className="w-20 text-right text-[10px] text-slate-500 shrink-0">
        {task.fechaFin ? formatDate(task.fechaFin) : <span className="text-slate-300">—</span>}
      </span>
    </div>
  )
}
