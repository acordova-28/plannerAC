import { useMemo } from 'react'
import { Task, ComputedTask, ProjectConfig, calcTaskDates, calcBaselineDates } from '@wuolla/shared'

export function useComputedTasks(tasks: Task[], config: ProjectConfig): ComputedTask[] {
  return useMemo(() => {
    const dates    = calcTaskDates(tasks, config)
    const baseline = calcBaselineDates(tasks, config)

    return tasks.map((task, i) => {
      const { start, end }         = dates[i]
      const { start: bStart, end: bEnd } = baseline[i]

      const duracionDias =
        start && end
          ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1)
          : null

      return {
        ...task,
        fechaInicio:         start,
        fechaFin:            end,
        fechaInicioBaseline: bStart,
        fechaFinBaseline:    bEnd,
        duracionDias,
      }
    })
  }, [tasks, config])
}
