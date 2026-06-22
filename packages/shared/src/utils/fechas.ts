import type { Task, ProjectConfig } from '../types/tarea.types'

export function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

export function firstWorkday(d: Date): Date {
  const r = new Date(d)
  while (isWeekend(r)) r.setDate(r.getDate() + 1)
  return r
}

export function nextWorkday(d: Date): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + 1)
  while (isWeekend(r)) r.setDate(r.getDate() + 1)
  return r
}

function calcDatesFromHours(
  tasks: Task[],
  getHours: (t: Task) => number | null,
  config: ProjectConfig,
): Array<{ start: Date | null; end: Date | null }> {
  let day   = firstWorkday(config.fechaInicio)
  let hLeft = config.horasPorDia

  return tasks.map(task => {
    const h = getHours(task)
    if (!h || h <= 0) return { start: null, end: null }

    let pending  = h
    const tStart = new Date(day)

    while (pending > 0) {
      const use = Math.min(pending, hLeft)
      pending  -= use
      hLeft    -= use
      if (hLeft === 0 && pending > 0) {
        day   = nextWorkday(day)
        hLeft = config.horasPorDia
      }
    }

    const tEnd = new Date(day)
    if (hLeft === 0) {
      day   = nextWorkday(day)
      hLeft = config.horasPorDia
    }

    return { start: tStart, end: tEnd }
  })
}

export const calcTaskDates = (tasks: Task[], config: ProjectConfig) =>
  calcDatesFromHours(tasks, t => t.horas, config)

export const calcBaselineDates = (tasks: Task[], config: ProjectConfig) =>
  calcDatesFromHours(tasks, t => t.horasBaseline, config)
