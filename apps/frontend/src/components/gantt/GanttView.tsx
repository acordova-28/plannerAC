import { useRef, useState, useCallback } from 'react'
import { ComputedTask } from '@wuolla/shared'
import { useTaskStore } from '../../store/useTaskStore'
import { useGanttLayout } from '../../hooks/useGanttLayout'
import GanttTable from './GanttTable'
import GanttChart from './GanttChart'

interface Props { tasks: ComputedTask[] }

export default function GanttView({ tasks }: Props) {
  const config    = useTaskStore(s => s.config)
  const zoomLevel = useTaskStore(s => s.zoomLevel)

  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set())
  const layout = useGanttLayout(tasks, zoomLevel, config, collapsedModules)

  // Scroll sync refs
  const leftBodyRef  = useRef<HTMLDivElement>(null)
  const rightBodyRef = useRef<HTMLDivElement>(null)
  const timelineRef  = useRef<HTMLDivElement>(null)
  const isSyncing    = useRef(false)

  const handleLeftScroll = useCallback(() => {
    if (isSyncing.current) return
    isSyncing.current = true
    if (rightBodyRef.current && leftBodyRef.current) {
      rightBodyRef.current.scrollTop = leftBodyRef.current.scrollTop
    }
    isSyncing.current = false
  }, [])

  const handleRightScroll = useCallback(() => {
    if (isSyncing.current) return
    isSyncing.current = true
    if (leftBodyRef.current && rightBodyRef.current) {
      leftBodyRef.current.scrollTop = rightBodyRef.current.scrollTop
    }
    if (timelineRef.current && rightBodyRef.current) {
      timelineRef.current.scrollLeft = rightBodyRef.current.scrollLeft
    }
    isSyncing.current = false
  }, [])

  const toggleModule = useCallback((modulo: string) => {
    setCollapsedModules(prev => {
      const next = new Set(prev)
      next.has(modulo) ? next.delete(modulo) : next.add(modulo)
      return next
    })
  }, [])

  return (
    <div className="flex h-full overflow-hidden bg-white">
      <GanttTable
        tasks={tasks}
        layout={layout}
        collapsedModules={collapsedModules}
        onToggleModule={toggleModule}
        bodyRef={leftBodyRef}
        onBodyScroll={handleLeftScroll}
      />

      <GanttChart
        tasks={tasks}
        layout={layout}
        zoomLevel={zoomLevel}
        collapsedModules={collapsedModules}
        timelineRef={timelineRef}
        bodyRef={rightBodyRef}
        onBodyScroll={handleRightScroll}
      />
    </div>
  )
}
