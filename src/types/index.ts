export enum Estado {
  Pendiente  = 'Pendiente',
  EnProgreso = 'En progreso',
  Completado = 'Completado',
  Bloqueado  = 'Bloqueado',
}

export enum Prioridad {
  Alta  = 'Alta',
  Media = 'Media',
  Baja  = 'Baja',
}

export enum Tipo {
  Frontend  = 'Frontend',
  Backend   = 'Backend',
  FrontBack = 'Front/Back',
  SinTipo   = '',
}

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

export type ViewMode = 'gantt' | 'kanban'
