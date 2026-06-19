import { useMemo } from 'react'
import { ComputedTask, ZoomLevel, ProjectConfig } from '../types'
import { DAY_WIDTH, ROW_HEIGHT, GROUP_ROW_HEIGHT, PLAN_BAR_H, BASELINE_BAR_H } from '../constants/gantt'
import { diffDays, addDays } from '../utils/dateUtils'

export interface BarLayout {
  rowY:          number
  baselineX:     number | null
  baselineW:     number | null
  planX:         number | null
  planW:         number | null
  progressW:     number | null
  barCenterY:    number
  baselineCenterY: number
}

export interface GanttLayout {
  dayWidth:      number
  chartStart:    Date
  chartEnd:      Date
  totalDays:     number
  chartWidth:    number
  chartHeight:   number
  modules:       string[]
  getX:          (date: Date) => number
  taskLayouts:   Map<string, BarLayout>
}

export function useGanttLayout(
  tasks: ComputedTask[],
  zoomLevel: ZoomLevel,
  config: ProjectConfig,
  collapsedModules: Set<string>,
): GanttLayout {
  return useMemo(() => {
    const dw = DAY_WIDTH[zoomLevel]

    // Chart date range
    const allDates = tasks
      .flatMap(t => [t.fechaInicio, t.fechaFin, t.fechaInicioBaseline, t.fechaFinBaseline])
      .filter((d): d is Date => d !== null)

    const chartStart = addDays(config.fechaInicio, -7)

    const latest = allDates.length
      ? new Date(Math.max(...allDates.map(d => d.getTime())))
      : config.fechaInicio
    const chartEnd = addDays(latest, 30)

    const totalDays  = Math.max(90, diffDays(chartStart, chartEnd) + 1)
    const chartWidth = totalDays * dw

    const getX = (date: Date) => Math.round(diffDays(chartStart, date) * dw)
    const getW = (s: Date, e: Date) => Math.max(dw, Math.round((diffDays(s, e) + 1) * dw))

    const modules = [...new Set(tasks.map(t => t.modulo))]

    const taskLayouts = new Map<string, BarLayout>()
    let currentY = 0

    for (const modulo of modules) {
      currentY += GROUP_ROW_HEIGHT

      if (collapsedModules.has(modulo)) continue

      for (const task of tasks.filter(t => t.modulo === modulo)) {
        const rowY    = currentY
        const barCenterY = rowY + (ROW_HEIGHT - PLAN_BAR_H) / 2
        const baselineCenterY = rowY + (ROW_HEIGHT - BASELINE_BAR_H) / 2

        const planX = task.fechaInicio ? getX(task.fechaInicio) : null
        const planW = task.fechaInicio && task.fechaFin ? getW(task.fechaInicio, task.fechaFin) : null

        const baselineX = task.fechaInicioBaseline ? getX(task.fechaInicioBaseline) : null
        const baselineW = task.fechaInicioBaseline && task.fechaFinBaseline
          ? getW(task.fechaInicioBaseline, task.fechaFinBaseline) : null

        const progressW = planW !== null ? planW * (task.porcentajeReal / 100) : null

        taskLayouts.set(task.id, { rowY, baselineX, baselineW, planX, planW, progressW, barCenterY, baselineCenterY })
        currentY += ROW_HEIGHT
      }
    }

    return {
      dayWidth: dw,
      chartStart,
      chartEnd,
      totalDays,
      chartWidth,
      chartHeight: currentY,
      modules,
      getX,
      taskLayouts,
    }
  }, [tasks, zoomLevel, config, collapsedModules])
}
