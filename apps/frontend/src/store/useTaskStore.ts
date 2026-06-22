import { create } from 'zustand'
import { Task, ProjectConfig, FilterState, ZoomLevel, ViewMode, Estado, Prioridad, Tipo } from '@wuolla/shared'
import { getTareas, updateTarea, FlatTask } from '../api/tareas.api'

function toTask(ft: FlatTask): Task {
  return {
    id:             ft.id,
    modulo:         ft.modulo,
    tarea:          ft.tarea,
    horas:          ft.horas,
    horasBaseline:  ft.horasBaseline,
    prioridad:      ft.prioridad as Prioridad,
    responsable:    ft.responsable,
    estado:         ft.estado as Estado,
    tipo:           (ft.tipo ?? '') as Tipo,
    orden:          ft.orden,
    porcentajeReal: ft.porcentajeReal,
  }
}

interface TaskStore {
  tasks:         Task[]
  status:        'idle' | 'loading' | 'error'
  config:        ProjectConfig
  filters:       FilterState
  activeTaskId:  string | null
  zoomLevel:     ZoomLevel
  view:          ViewMode

  loadTasks:     () => Promise<void>
  updateTask:    (id: string, changes: Partial<Task>) => void
  updateConfig:  (changes: Partial<ProjectConfig>) => void
  setFilters:    (changes: Partial<FilterState>) => void
  clearFilters:  () => void
  setActiveTask: (id: string | null) => void
  setZoom:       (level: ZoomLevel) => void
  setView:       (view: ViewMode) => void
  freezeBaseline: () => void
  moveKanban:    (id: string, newEstado: Estado) => void
}

const EMPTY_FILTERS: FilterState = {
  responsable: [],
  modulo:      [],
  prioridad:   [] as Prioridad[],
  tipo:        [] as Tipo[],
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks:        [],
  status:       'idle',
  config: {
    fechaInicio:  new Date(2026, 5, 18),
    horasPorDia:  8,
    baselineDate: null,
  },
  filters:      EMPTY_FILTERS,
  activeTaskId: null,
  zoomLevel:    'semana',
  view:         'gantt',

  loadTasks: async () => {
    set({ status: 'loading' })
    try {
      const data = await getTareas()
      set({ tasks: data.map(toTask), status: 'idle' })
    } catch {
      set({ status: 'error' })
    }
  },

  updateTask: (id, changes) => {
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...changes } : t) }))
    updateTarea(id, changes)
  },

  updateConfig: (changes) =>
    set(s => ({ config: { ...s.config, ...changes } })),

  setFilters: (changes) =>
    set(s => ({ filters: { ...s.filters, ...changes } })),

  clearFilters: () => set({ filters: EMPTY_FILTERS }),

  setActiveTask: (id) => set({ activeTaskId: id }),

  setZoom: (level) => set({ zoomLevel: level }),

  setView: (view) => set({ view }),

  freezeBaseline: () =>
    set(s => ({
      tasks: s.tasks.map(t => ({ ...t, horasBaseline: t.horas })),
      config: { ...s.config, baselineDate: new Date() },
    })),

  moveKanban: (id, newEstado) => {
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, estado: newEstado } : t),
    }))
    updateTarea(id, { estado: newEstado })
  },
}))
