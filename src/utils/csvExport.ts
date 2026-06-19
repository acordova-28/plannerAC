import { ComputedTask, ProjectConfig } from '../types'
import { formatDate, formatDateISO } from './dateUtils'

export function exportCSV(tasks: ComputedTask[], config: ProjectConfig): void {
  const header = 'ID,Módulo,Tarea,Horas,Prioridad,Responsable,Estado,Fecha Inicio,Fecha Fin,Tipo\n'
  const rows = tasks.map(t => {
    const s = t.fechaInicio ? formatDate(t.fechaInicio) : ''
    const e = t.fechaFin    ? formatDate(t.fechaFin)    : ''
    return `"${t.id}","${t.modulo}","${t.tarea}","${t.horas ?? ''}","${t.prioridad}","${t.responsable}","${t.estado}","${s}","${e}","${t.tipo}"`
  }).join('\n')

  const csv  = header + rows
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `Estimacion_WUOLLA_${formatDateISO(config.fechaInicio)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
