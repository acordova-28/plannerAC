import { apiFetch } from './client'

export interface ReorderItem {
  taskId:   string
  moduloId: string
  orden:    number
}

export async function reorderTasks(planId: string, items: ReorderItem[]): Promise<void> {
  const res = await apiFetch(`/api/plans/${planId}/reorder-tasks`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
}

export interface FlatTask {
  id:             string
  moduloId:       string
  modulo:         string
  tarea:          string
  horas:          number | null
  horasBaseline:  number | null
  prioridad:      string
  responsable:    string
  assigneeId:     string | null
  estado:         string
  tipo:           string
  orden:          number
  porcentajeReal: number
  fechaInicio:    string | null
  fechaFin:       string | null
  description:    string | null
  notes:          string | null
  custom:         Record<string, string>
}

export interface UpdateTareaInput {
  tarea?:          string
  horas?:          number | null
  horasBaseline?:  number | null
  prioridad?:      string
  estado?:         string
  tipo?:           string | null
  porcentajeReal?: number
  assigneeId?:     string | null
  fechaInicio?:    string | null
  description?:    string | null
  notes?:          string | null
}

export interface CreateTaskInput {
  nombre:         string
  estado?:        string
  horasEstimadas: number | null
  prioridad:      string
  tipo:           string | null
  fechaInicio?:   string | null
  description?:   string | null
  notes?:         string | null
  assigneeId?:    string | null
}

export async function createTarea(moduloId: string, data: CreateTaskInput): Promise<void> {
  const body: Record<string, unknown> = { nombre: data.nombre }
  if (data.estado        != null)  body.estado          = data.estado
  if (data.horasEstimadas != null) body.horasEstimadas  = data.horasEstimadas
  if (data.prioridad)              body.prioridad       = data.prioridad
  if (data.tipo)                   body.tipo            = data.tipo
  if (data.description)            body.description     = data.description
  if (data.notes)                  body.notes           = data.notes
  if (data.assigneeId)             body.responsableIds  = [data.assigneeId]
  if (data.fechaInicio != null)    body.fechaInicio     = data.fechaInicio

  const res = await apiFetch(`/api/modulos/${moduloId}/tareas`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? 'Error al crear la tarea')
  }
}

export async function getTareas(planId?: string): Promise<FlatTask[]> {
  const url = planId ? `/api/tareas?planId=${planId}` : '/api/tareas'
  const res = await apiFetch(url)
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function deleteTarea(id: string): Promise<void> {
  const res = await apiFetch(`/api/tareas/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Error al eliminar la tarea`)
}

export async function updateTarea(id: string, changes: UpdateTareaInput): Promise<void> {
  const dto: Record<string, unknown> = {}
  if (changes.tarea !== undefined)          dto.nombre             = changes.tarea
  if (changes.horas !== undefined)          dto.horasEstimadas     = changes.horas
  if (changes.horasBaseline !== undefined)  dto.horasBaseline      = changes.horasBaseline
  if (changes.prioridad !== undefined)      dto.prioridad          = changes.prioridad
  if (changes.estado !== undefined)         dto.estado             = changes.estado
  if (changes.tipo !== undefined)           dto.tipo               = changes.tipo || null
  if (changes.porcentajeReal !== undefined) dto.porcentajeProgreso = changes.porcentajeReal
  if (changes.assigneeId !== undefined)     dto.responsableIds     = changes.assigneeId ? [changes.assigneeId] : []
  if (changes.fechaInicio !== undefined)   dto.fechaInicio        = changes.fechaInicio
  if (changes.description !== undefined)   dto.description        = changes.description
  if (changes.notes !== undefined)         dto.notes              = changes.notes
  if (!Object.keys(dto).length) return
  await apiFetch(`/api/tareas/${id}`, { method: 'PUT', body: JSON.stringify(dto) })
}
