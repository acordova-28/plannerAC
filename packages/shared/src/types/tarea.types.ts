import { Estado } from '../enums/estado.enum'
import { Prioridad } from '../enums/prioridad.enum'
import { Tipo } from '../enums/tipo.enum'

export type Modulo = string

export interface Task {
  id:             string
  modulo:         Modulo
  tarea:          string
  prioridad:      Prioridad
  responsable:    string
  estado:         Estado
  tipo:           Tipo
  orden:          number
  horas:          number | null
  horasBaseline:  number | null
  porcentajeReal: number
}

export interface ComputedTask extends Task {
  fechaInicio:         Date | null
  fechaFin:            Date | null
  fechaInicioBaseline: Date | null
  fechaFinBaseline:    Date | null
  duracionDias:        number | null
}

export interface ProjectConfig {
  fechaInicio:  Date
  horasPorDia:  number
  baselineDate: Date | null
}

export interface FilterState {
  responsable: string[]
  modulo:      string[]
  prioridad:   Prioridad[]
  tipo:        Tipo[]
}

export type ZoomLevel = 'dia' | 'semana' | 'mes'
export type ViewMode  = 'gantt' | 'kanban'
