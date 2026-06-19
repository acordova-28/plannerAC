import { create } from 'zustand'
import { Task, ProjectConfig, FilterState, ZoomLevel, ViewMode, Estado, Prioridad, Tipo } from '../types'
import { INITIAL_TASKS } from '../data/tasks'

interface TaskStore {
  tasks:         Task[]
  config:        ProjectConfig
  filters:       FilterState
  activeTaskId:  string | null
  zoomLevel:     ZoomLevel
  view:          ViewMode

  updateTask:      (id: string, changes: Partial<Task>) => void
  updateConfig:    (changes: Partial<ProjectConfig>) => void
  setFilters:      (changes: Partial<FilterState>) => void
  clearFilters:    () => void
  setActiveTask:   (id: string | null) => void
  setZoom:         (level: ZoomLevel) => void
  setView:         (view: ViewMode) => void
  freezeBaseline:  () => void
  moveKanban:      (id: string, newEstado: Estado) => void
}

const EMPTY_FILTERS: FilterState = {
  responsable: [],
  modulo:      [],
  prioridad:   [] as Prioridad[],
  tipo:        [] as Tipo[],
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks:        INITIAL_TASKS,
  config: {
    fechaInicio:  new Date(2026, 5, 18),
    horasPorDia:  8,
    baselineDate: null,
  },
  filters:      EMPTY_FILTERS,
  activeTaskId: null,
  zoomLevel:    'semana',
  view:         'gantt',

  updateTask: (id, changes) =>
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...changes } : t) })),

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

  moveKanban: (id, newEstado) =>
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, estado: newEstado } : t),
    })),
}))
