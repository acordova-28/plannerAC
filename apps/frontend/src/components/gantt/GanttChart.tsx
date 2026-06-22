import { useState, RefObject } from 'react'
import { ComputedTask, ZoomLevel } from '@wuolla/shared'
import { GanttLayout } from '../../hooks/useGanttLayout'
import { useTaskStore } from '../../store/useTaskStore'
import GanttBars from './GanttBars'
import GanttTimeline from './GanttTimeline'
import GanttTooltip from './GanttTooltip'

interface TooltipState { task: ComputedTask; cx: number; cy: number }

interface Props {
  tasks:            ComputedTask[]
  layout:           GanttLayout
  zoomLevel:        ZoomLevel
  collapsedModules: Set<string>
  timelineRef:      RefObject<HTMLDivElement | null>
  bodyRef:          RefObject<HTMLDivElement | null>
  onBodyScroll:     () => void
}

export default function GanttChart({ tasks, layout, zoomLevel, collapsedModules, timelineRef, bodyRef, onBodyScroll }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const setActiveTask          = useTaskStore(s => s.setActiveTask)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Timeline header - scroll X controlled externally */}
      <div ref={timelineRef} className="overflow-x-hidden shrink-0">
        <GanttTimeline layout={layout} zoomLevel={zoomLevel} />
      </div>

      {/* Chart body */}
      <div
        ref={bodyRef}
        onScroll={onBodyScroll}
        className="flex-1 overflow-auto gantt-scroll"
      >
        <GanttBars
          tasks={tasks}
          layout={layout}
          collapsedModules={collapsedModules}
          onHover={(task, cx, cy) => setTooltip({ task, cx, cy })}
          onLeave={() => setTooltip(null)}
          onClick={task => setActiveTask(task.id)}
        />
      </div>

      {tooltip && (
        <GanttTooltip
          task={tooltip.task}
          clientX={tooltip.cx}
          clientY={tooltip.cy}
        />
      )}
    </div>
  )
}
