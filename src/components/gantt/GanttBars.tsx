import { ComputedTask } from '../../types'
import { GanttLayout } from '../../hooks/useGanttLayout'
import { addDays } from '../../utils/dateUtils'
import { isWeekend } from '../../utils/workingDays'
import { ROW_HEIGHT, GROUP_ROW_HEIGHT } from '../../constants/gantt'
import GanttBar from './GanttBar'
import GanttTodayLine from './GanttTodayLine'

interface Props {
  tasks:            ComputedTask[]
  layout:           GanttLayout
  collapsedModules: Set<string>
  onHover:          (task: ComputedTask, cx: number, cy: number) => void
  onLeave:          () => void
  onClick:          (task: ComputedTask) => void
}

export default function GanttBars({ tasks, layout, collapsedModules, onHover, onLeave, onClick }: Props) {
  const { chartWidth, chartHeight, totalDays, dayWidth, chartStart, getX, taskLayouts, modules } = layout

  const today     = new Date()
  const todayX    = getX(today)
  const showToday = todayX >= 0 && todayX <= chartWidth

  return (
    <svg
      width={chartWidth}
      height={Math.max(chartHeight, 1)}
      style={{ display: 'block' }}
    >
      {/* Weekend shading */}
      {Array.from({ length: totalDays }, (_, i) => {
        const d = addDays(chartStart, i)
        if (!isWeekend(d)) return null
        return (
          <rect key={`we-${i}`} x={i * dayWidth} y={0} width={dayWidth} height={chartHeight} fill="#f8fafc" />
        )
      })}

      {/* Row backgrounds */}
      <RowBackgrounds
        modules={modules} tasks={tasks}
        layout={layout} collapsedModules={collapsedModules}
      />

      {/* Vertical week/day grid lines */}
      <GridLines totalDays={totalDays} dayWidth={dayWidth} chartHeight={chartHeight} />

      {/* Today line */}
      {showToday && <GanttTodayLine x={todayX} height={chartHeight} />}

      {/* Task bars */}
      {tasks.map(task => {
        const bl = taskLayouts.get(task.id)
        if (!bl) return null
        return (
          <GanttBar
            key={task.id}
            task={task}
            layout={bl}
            onHover={onHover}
            onLeave={onLeave}
            onClick={onClick}
          />
        )
      })}
    </svg>
  )
}

function RowBackgrounds({ modules, tasks, layout, collapsedModules }: {
  modules:          string[]
  tasks:            ComputedTask[]
  layout:           GanttLayout
  collapsedModules: Set<string>
}) {
  const { chartWidth } = layout
  let y = 0
  const rows: React.ReactNode[] = []

  for (const modulo of modules) {
    rows.push(
      <rect key={`mod-${modulo}`} x={0} y={y} width={chartWidth} height={GROUP_ROW_HEIGHT}
        fill="#e2e8f0" />
    )
    y += GROUP_ROW_HEIGHT

    if (collapsedModules.has(modulo)) continue

    tasks.filter(t => t.modulo === modulo).forEach((_, idx) => {
      rows.push(
        <rect key={`row-${idx}-${modulo}`} x={0} y={y} width={chartWidth} height={ROW_HEIGHT}
          fill={idx % 2 === 0 ? '#ffffff' : '#f8fafc'} />
      )
      y += ROW_HEIGHT
    })
  }

  return <>{rows}</>
}

function GridLines({ totalDays, dayWidth, chartHeight }: {
  totalDays:   number
  dayWidth:    number
  chartHeight: number
}) {
  const lines: React.ReactNode[] = []
  for (let i = 7; i < totalDays; i += 7) {
    lines.push(
      <line key={i} x1={i * dayWidth} y1={0} x2={i * dayWidth} y2={chartHeight}
        stroke="#e2e8f0" strokeWidth={1} />
    )
  }
  return <>{lines}</>
}
