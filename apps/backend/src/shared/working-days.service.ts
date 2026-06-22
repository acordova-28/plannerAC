import { Injectable } from '@nestjs/common'

@Injectable()
export class WorkingDaysService {
  private isWeekend(d: Date): boolean {
    const day = d.getDay()
    return day === 0 || day === 6
  }

  private addDays(d: Date, n: number): Date {
    const result = new Date(d)
    result.setDate(result.getDate() + n)
    return result
  }

  firstWorkday(d: Date): Date {
    let result = new Date(d)
    while (this.isWeekend(result)) {
      result = this.addDays(result, 1)
    }
    return result
  }

  nextWorkday(d: Date): Date {
    let next = this.addDays(d, 1)
    while (this.isWeekend(next)) {
      next = this.addDays(next, 1)
    }
    return next
  }

  /**
   * Given a start date and hours of work, returns { fechaInicio, fechaFin }.
   * horasPorDia: working hours per day (1–24).
   * Mirrors the algorithm in src/utils/workingDays.ts on the frontend.
   */
  calcDates(
    start: Date,
    horas: number,
    horasPorDia: number,
  ): { fechaInicio: Date; fechaFin: Date } {
    const fechaInicio = this.firstWorkday(start)
    if (horas <= 0) {
      return { fechaInicio, fechaFin: fechaInicio }
    }

    let remaining = horas
    let current = fechaInicio

    while (remaining > horasPorDia) {
      remaining -= horasPorDia
      current = this.nextWorkday(current)
    }

    return { fechaInicio, fechaFin: current }
  }

  /**
   * Recalculates sequential dates for a sorted list of tasks.
   * Returns the same array annotated with fechaInicio / fechaFin (Date objects).
   */
  recalcSequential<T extends { horasEstimadas: number | null }>(
    tasks: T[],
    planStart: Date,
    horasPorDia: number,
  ): Array<T & { fechaInicio: Date | null; fechaFin: Date | null }> {
    let cursor = planStart
    return tasks.map(task => {
      if (task.horasEstimadas == null || task.horasEstimadas <= 0) {
        return { ...task, fechaInicio: null, fechaFin: null }
      }
      const { fechaInicio, fechaFin } = this.calcDates(cursor, task.horasEstimadas, horasPorDia)
      cursor = this.nextWorkday(fechaFin)
      return { ...task, fechaInicio, fechaFin }
    })
  }
}
