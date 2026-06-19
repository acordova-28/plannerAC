import { ComputedTask, Estado } from '../../types'
import { BarLayout } from '../../hooks/useGanttLayout'
import { BASELINE_BAR_H, PLAN_BAR_H, BAR_BORDER_RADIUS, ROW_HEIGHT } from '../../constants/gantt'

const PLAN_COLOR: Partial<Record<Estado, string>> = {
  [Estado.Completado]: '#16a34a',
  [Estado.Bloqueado]:  '#92400e',
}

const PROGRESS_COLOR: Partial<Record<Estado, string>> = {
  [Estado.Completado]: '#22c55e',
  [Estado.EnProgreso]: '#f97316',
  [Estado.Bloqueado]:  '#f59e0b',
  [Estado.Pendiente]:  '#f87171',
}

interface Props {
  task:    ComputedTask
  layout:  BarLayout
  onHover: (task: ComputedTask, cx: number, cy: number) => void
  onLeave: () => void
  onClick: (task: ComputedTask) => void
}

export default function GanttBar({ task, layout, onHover, onLeave, onClick }: Props) {
  const { planX, planW, baselineX, baselineW, progressW, barCenterY, baselineCenterY, rowY } = layout

  if (planX === null || planW === null) return null

  const planFill     = PLAN_COLOR[task.estado]     ?? '#2563eb'
  const progressFill = PROGRESS_COLOR[task.estado] ?? '#f87171'
  const isBlocked    = task.estado === Estado.Bloqueado

  return (
    <g>
      {/* Baseline layer */}
      {baselineX !== null && baselineW !== null && (
        <rect
          x={baselineX} y={baselineCenterY}
          width={baselineW} height={BASELINE_BAR_H}
          rx={BAR_BORDER_RADIUS} fill="#cbd5e1"
        />
      )}

      {/* Plan layer */}
      <rect
        x={planX} y={barCenterY}
        width={planW} height={PLAN_BAR_H}
        rx={BAR_BORDER_RADIUS}
        fill={planFill}
        opacity={isBlocked ? 0.6 : 1}
      />

      {/* Progress layer */}
      {progressW !== null && progressW > 0 && (
        <rect
          x={planX} y={barCenterY}
          width={progressW} height={PLAN_BAR_H}
          rx={BAR_BORDER_RADIUS}
          fill={progressFill}
        />
      )}

      {/* Blocked label */}
      {isBlocked && planW > 20 && (
        <text
          x={planX + 6} y={barCenterY + PLAN_BAR_H / 2 + 4}
          fontSize={11} fill="#92400e" fontWeight="bold"
        >
          🔒
        </text>
      )}

      {/* Hover / click target */}
      <rect
        x={planX - 2} y={rowY}
        width={planW + 4} height={ROW_HEIGHT}
        fill="transparent"
        style={{ cursor: 'pointer' }}
        onMouseEnter={e => onHover(task, e.clientX, e.clientY)}
        onMouseMove={e => onHover(task, e.clientX, e.clientY)}
        onMouseLeave={onLeave}
        onClick={() => onClick(task)}
      />
    </g>
  )
}
