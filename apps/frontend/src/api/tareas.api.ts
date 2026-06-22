import { apiFetch } from './client'
import type { Task } from '@wuolla/shared'

export interface FlatTask {
  id:             string
  modulo:         string
  tarea:          string
  horas:          number | null
  horasBaseline:  number | null
  prioridad:      string
  responsable:    string
  estado:         string
  tipo:           string
  orden:          number
  porcentajeReal: number
}

export async function getTareas(): Promise<FlatTask[]> {
  const res = await apiFetch('/api/tareas')
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function updateTarea(id: string, changes: Partial<Task>): Promise<void> {
  const dto: Record<string, unknown> = {}
  if (changes.tarea !== undefined)          dto.nombre             = changes.tarea
  if (changes.horas !== undefined)          dto.horasEstimadas     = changes.horas
  if (changes.horasBaseline !== undefined)  dto.horasBaseline      = changes.horasBaseline
  if (changes.prioridad !== undefined)      dto.prioridad          = changes.prioridad
  if (changes.estado !== undefined)         dto.estado             = changes.estado
  if (changes.tipo !== undefined)           dto.tipo               = changes.tipo || null
  if (changes.porcentajeReal !== undefined) dto.porcentajeProgreso = changes.porcentajeReal
  if (!Object.keys(dto).length) return
  await apiFetch(`/api/tareas/${id}`, { method: 'PUT', body: JSON.stringify(dto) })
}
