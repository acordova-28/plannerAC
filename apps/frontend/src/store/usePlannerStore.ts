import { create } from 'zustand'
import {
  getPlans, getPlanMembers, getPlanModulos, getUsers,
  createPlan, deletePlan, updatePlanName,
  addPlanMember, removePlanMember, updatePlanMemberHours,
  createModulo, updateModulo, deleteModulo,
  freezeBaselinePlan,
} from '../api/plans.api'
import { getTareas, updateTarea, createTarea, deleteTarea, reorderTasks } from '../api/tareas.api'
import type { ReorderItem } from '../api/tareas.api'
import { getCampos, createCampo, deleteCampo, setValorCampo } from '../api/campos.api'
import type { FlatTask } from '../api/tareas.api'

export type TaskStatus   = 'todo' | 'progress' | 'blocked' | 'done'
export type TaskPriority = 'alta' | 'media' | 'baja'
export type PlannerView  = 'table' | 'kanban' | 'gantt'
export type NavSection   = 'tareas' | 'kanban' | 'gantt' | 'modulos' | 'miembros' | 'equipos' | 'stats' | 'config'
export type GanttZoom    = 'days' | 'weeks'
export type ColorBy      = 'module' | 'status'
export type ColType      = 'text' | 'number' | 'date' | 'select' | 'checkbox'

export interface PlannerTask {
  id:          string
  teamId:      string
  name:        string
  moduleId:    string
  assigneeId:  string
  startDate:   string | null
  durationHrs: number
  status:      TaskStatus
  priority:    TaskPriority
  description: string
  notes:       string
  custom:      Record<string, string>
}

export interface Team {
  id:        string
  name:      string
  color:     string
  memberIds: string[]
}

export interface Member {
  id:          string
  name:        string
  hoursPerDay: number
  color:       string
}

export interface PlannerModule {
  id:     string
  teamId: string
  name:   string
  color:  string
}

export interface CustomColumn {
  id:   string
  name: string
  type: ColType
}

export const STATUS_META: Record<TaskStatus, { label: string; bg: string; fg: string; dot: string }> = {
  todo:     { label: 'Por hacer',   bg: '#eef1f5', fg: '#475569', dot: '#94a3b8' },
  progress: { label: 'En progreso', bg: '#e0edff', fg: '#1d4ed8', dot: '#2563eb' },
  blocked:  { label: 'Bloqueado',   bg: '#fde7e7', fg: '#b91c1c', dot: '#dc2626' },
  done:     { label: 'Completado',  bg: '#dcf5e6', fg: '#15803d', dot: '#16a34a' },
}
export const STATUS_ORDER: TaskStatus[] = ['todo', 'progress', 'blocked', 'done']
export const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  alta:  { label: 'Alta',  color: '#dc2626' },
  media: { label: 'Media', color: '#d97706' },
  baja:  { label: 'Baja',  color: '#16a34a' },
}
export const PALETTE = ['#2563eb','#7c3aed','#16a34a','#ea580c','#0d9488','#db2777','#ca8a04','#dc2626']

// ─── Date utils ──────────────────────────────────────────────────────────────
export function toISO(dt: Date): string {
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}
export function todayISO(): string { return toISO(new Date()) }
export function parseISO(s: string): Date {
  const [y,m,d] = s.split('-').map(Number)
  return new Date(y, m-1, d, 12)
}
function isWeekend(dt: Date): boolean { const d = dt.getDay(); return d === 0 || d === 6 }
function workDays(hrs: number, hpd: number): number { return Math.max(1, Math.ceil((hrs||0)/(hpd||8))) }
export function computeEndISO(task: PlannerTask, members: Member[]): string | null {
  if (!task.startDate) return null
  const m = members.find(m => m.id === task.assigneeId)
  const hpd = m ? m.hoursPerDay : 8
  const n = workDays(task.durationHrs, hpd)
  const d = parseISO(task.startDate)
  while (isWeekend(d)) d.setDate(d.getDate()+1)
  let rem = n - 1
  while (rem > 0) { d.setDate(d.getDate()+1); if (!isWeekend(d)) rem-- }
  return toISO(d)
}
export function dayDiff(aISO: string, bISO: string): number {
  return Math.round((parseISO(bISO).getTime() - parseISO(aISO).getTime()) / 86400000)
}
const MONTH_ABBR = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
export function fmtShort(dt: Date): string { return `${dt.getDate()} ${MONTH_ABBR[dt.getMonth()]}` }
export function initials(name: string): string {
  const p = (name||'').trim().split(/\s+/)
  return ((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase()||'?'
}
export function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#','')
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
  return `rgba(${r},${g},${b},${a})`
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────
function colorFromId(id: string): string {
  const n = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PALETTE[n % PALETTE.length]
}

function estadoToStatus(estado: string): TaskStatus {
  const map: Record<string, TaskStatus> = {
    'Pendiente':    'todo',
    'En progreso':  'progress',
    'Bloqueado':    'blocked',
    'Completado':   'done',
  }
  return map[estado] ?? 'todo'
}

function statusToEstado(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    todo:     'Pendiente',
    progress: 'En progreso',
    blocked:  'Bloqueado',
    done:     'Completado',
  }
  return map[status]
}

function priorityToApi(priority: TaskPriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

function apiToPriority(prioridad: string): TaskPriority {
  const p = prioridad.toLowerCase() as TaskPriority
  return (['alta', 'media', 'baja'] as TaskPriority[]).includes(p) ? p : 'media'
}

function colTypeToTipoDato(type: ColType): string {
  const map: Record<ColType, string> = {
    text: 'texto', number: 'numero', date: 'fecha',
    select: 'texto', checkbox: 'booleano',
  }
  return map[type]
}

function flatToPlannerTask(ft: FlatTask, teamId: string): PlannerTask {
  return {
    id:          ft.id,
    teamId,
    name:        ft.tarea,
    moduleId:    ft.moduloId,
    assigneeId:  ft.assigneeId ?? '',
    startDate:   ft.fechaInicio ?? null,
    durationHrs: ft.horas ?? 0,
    status:      estadoToStatus(ft.estado),
    priority:    apiToPriority(ft.prioridad),
    description: ft.description ?? '',
    notes:       ft.notes ?? '',
    custom:      ft.custom ?? {},
  }
}

// ─── Store interface ──────────────────────────────────────────────────────────
interface PlannerStore {
  status:        'idle' | 'loading' | 'error'
  view:          PlannerView
  section:       NavSection
  activeTeamId:  string
  modalOpen:     boolean
  draft:         PlannerTask | null
  collapsed:     Record<string, boolean>
  ganttZoom:     GanttZoom
  ganttOffset:   number
  colorBy:       ColorBy
  dragId:          string | null
  dragOverCol:     string | null
  dragOverTaskId:  string | null
  addingColumn:  boolean
  newColName:    string
  newColType:    ColType
  customColumns: CustomColumn[]
  teams:         Team[]
  members:       Member[]
  allUsers:      Member[]
  modules:       PlannerModule[]
  tasks:         PlannerTask[]

  loadPlans:         (targetPlanId?: string) => Promise<void>
  loadPlanData:      (planId: string) => Promise<void>
  setView:           (v: PlannerView) => void
  setSection:        (s: NavSection) => void
  activeTeam:        () => Team
  teamModules:       () => PlannerModule[]
  teamTasks:         () => PlannerTask[]
  teamMembers:       () => Member[]
  setActiveTeam:     (id: string) => void
  cycleTeam:         () => void
  toggleModule:      (id: string) => void

  openTask:          (id: string) => void
  openNewTask:       (status?: TaskStatus) => void
  closeModal:        () => void
  updateDraft:       (field: string, value: unknown) => void
  saveDraft:         () => Promise<void>
  deleteDraft:       () => Promise<void>
  deleteTaskById:    (id: string) => Promise<void>

  setDragId:         (id: string | null) => void
  setDragOverCol:    (col: string | null) => void
  setDragOverTask:   (id: string | null) => void
  dropOnColumn:      (status: TaskStatus, taskId?: string) => void
  dropOnTask:        (targetTaskId: string) => void

  setGanttZoom:      (zoom: GanttZoom) => void
  shiftGantt:        (delta: number) => void
  resetGantt:        () => void
  setColorBy:        (cb: ColorBy) => void

  startAddColumn:    () => void
  cancelAddColumn:   () => void
  setNewColName:     (name: string) => void
  setNewColType:     (type: string) => void
  confirmAddColumn:  () => Promise<void>
  updateCustomCell:  (taskId: string, colId: string, value: string) => void
  saveCustomCell:    (taskId: string, colId: string, value: string) => void
  deleteColumn:      (colId: string) => Promise<void>

  freezeBaseline:    () => Promise<void>
  addModule:         () => Promise<void>
  updateModuleName:  (id: string, name: string) => Promise<void>
  updateModuleColor: (id: string, color: string) => Promise<void>
  deleteModule:      (id: string) => Promise<void>

  updateMemberHours: (id: string, hours: number) => Promise<void>
  removeMember:      (id: string) => Promise<void>

  addTeam:           () => Promise<void>
  updateTeamName:    (id: string, name: string) => Promise<void>
  deleteTeam:        (id: string) => Promise<void>
  activateTeam:      (id: string) => void
  addTeamMember:     (teamId: string, memberId: string) => Promise<void>
  removeTeamMember:  (teamId: string, memberId: string) => Promise<void>
}

export const usePlannerStore = create<PlannerStore>()(
  (set, get) => ({
    status:        'idle',
    view:          'table',
    section:       'tareas',
    activeTeamId:  '',
    modalOpen:     false,
    draft:         null,
    collapsed:     {},
    ganttZoom:     'days',
    ganttOffset:   0,
    colorBy:       'module',
    dragId:         null,
    dragOverCol:    null,
    dragOverTaskId: null,
    addingColumn:  false,
    newColName:    '',
    newColType:    'text',
    customColumns: [],
    teams:         [],
    members:       [],
    allUsers:      [],
    modules:       [],
    tasks:         [],

    loadPlans: async (targetPlanId?: string) => {
      set({ status: 'loading' })
      try {
        const [plans, users] = await Promise.all([getPlans(), getUsers()])
        const teams: Team[] = plans.map(p => ({
          id:        p.id,
          name:      p.nombre,
          color:     colorFromId(p.id),
          memberIds: [],
        }))
        const allUsers: Member[] = users.map(u => ({
          id:          u.id,
          name:        u.nombre,
          hoursPerDay: 8,
          color:       colorFromId(u.id),
        }))
        const activeId = (targetPlanId && teams.some(t => t.id === targetPlanId))
          ? targetPlanId
          : teams[0]?.id ?? ''
        set({ teams, allUsers, activeTeamId: activeId, status: 'idle' })
        if (activeId) await get().loadPlanData(activeId)
      } catch {
        set({ status: 'error' })
      }
    },

    loadPlanData: async (planId: string) => {
      set({ status: 'loading' })
      try {
        const [modulos, planMembers, planTareas, campos] = await Promise.all([
          getPlanModulos(planId),
          getPlanMembers(planId),
          getTareas(planId),
          getCampos(planId),
        ])

        const planTasks = planTareas.map(ft => flatToPlannerTask(ft, planId))

        const newModules: PlannerModule[] = modulos.map(m => ({
          id:     m.id,
          teamId: planId,
          name:   m.nombre,
          color:  m.color || colorFromId(m.id),
        }))

        const newMembers: Member[] = planMembers.map(m => ({
          id:          m.id,
          name:        m.nombre,
          hoursPerDay: m.horasPorDia,
          color:       colorFromId(m.id),
        }))

        const newColumns = campos.map(c => ({ id: c.id, name: c.nombre, type: c.tipoDato as ColType }))

        set(s => ({
          status:        'idle',
          modules:       [...s.modules.filter(m => m.teamId !== planId), ...newModules],
          members:       newMembers,
          tasks:         [...s.tasks.filter(t => t.teamId !== planId), ...planTasks],
          customColumns: newColumns,
          teams:         s.teams.map(t =>
            t.id === planId ? { ...t, memberIds: newMembers.map(m => m.id) } : t
          ),
        }))
      } catch {
        set({ status: 'error' })
      }
    },

    setView:    (v) => set({ view: v }),
    setSection: (s) => set({ section: s }),

    activeTeam:  () => get().teams.find(t => t.id === get().activeTeamId) || get().teams[0],
    teamModules: () => get().modules.filter(m => m.teamId === get().activeTeamId),
    teamTasks:   () => get().tasks.filter(t => t.teamId === get().activeTeamId),
    teamMembers: () => {
      const ids = get().activeTeam()?.memberIds ?? []
      return get().members.filter(m => ids.includes(m.id))
    },

    setActiveTeam: (id) => {
      set({ activeTeamId: id, collapsed: {} })
      get().loadPlanData(id)
    },
    cycleTeam: () => {
      const ts = get().teams
      const i  = ts.findIndex(t => t.id === get().activeTeamId)
      const next = ts[(i+1) % ts.length]
      if (next) {
        set({ activeTeamId: next.id, collapsed: {} })
        get().loadPlanData(next.id)
      }
    },
    toggleModule: (id) => set(s => ({ collapsed: { ...s.collapsed, [id]: !s.collapsed[id] } })),

    openTask: (id) => {
      const t = get().tasks.find(x => x.id === id)
      if (t) set({ modalOpen: true, draft: { ...t, custom: { ...(t.custom||{}) } } })
    },
    openNewTask: (status = 'todo') => {
      const mods = get().teamModules()
      const mems = get().teamMembers()
      set({
        modalOpen: true,
        draft: {
          id: '', teamId: get().activeTeamId, name: '',
          moduleId: mods[0]?.id || '', assigneeId: mems[0]?.id || '',
          startDate: todayISO(), durationHrs: 8, status, priority: 'media',
          description: '', notes: '', custom: {},
        },
      })
    },
    closeModal:  () => set({ modalOpen: false, draft: null }),
    updateDraft: (field, value) => set(s => ({
      draft: s.draft ? { ...s.draft, [field]: value } : null,
    })),

    saveDraft: async () => {
      const d = get().draft
      if (!d) return
      const name = (d.name||'').trim() || 'Tarea sin título'
      const clean = { ...d, name }

      if (d.id) {
        set(s => ({ tasks: s.tasks.map(t => t.id === d.id ? clean : t), modalOpen: false, draft: null }))
        await updateTarea(d.id, {
          tarea:       name,
          estado:      statusToEstado(clean.status),
          prioridad:   priorityToApi(clean.priority),
          horas:       clean.durationHrs || null,
          assigneeId:  clean.assigneeId || null,
          fechaInicio: clean.startDate || null,
          description: clean.description || null,
          notes:       clean.notes || null,
        })
      } else {
        await createTarea(clean.moduleId, {
          nombre:         name,
          estado:         statusToEstado(clean.status),
          horasEstimadas: clean.durationHrs || null,
          prioridad:      priorityToApi(clean.priority),
          tipo:           null,
          fechaInicio:    clean.startDate || null,
          description:    clean.description || null,
          notes:          clean.notes || null,
          assigneeId:     clean.assigneeId || null,
        })
        set({ modalOpen: false, draft: null })
        await get().loadPlanData(get().activeTeamId)
      }
    },

    deleteDraft: async () => {
      const id = get().draft?.id
      if (!id) { get().closeModal(); return }
      set(s => ({ tasks: s.tasks.filter(t => t.id !== id), modalOpen: false, draft: null }))
      await deleteTarea(id)
    },

    deleteTaskById: async (id) => {
      set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
      await deleteTarea(id)
    },

    setDragId:        (id)  => set({ dragId: id }),
    setDragOverCol:   (col) => set({ dragOverCol: col }),
    setDragOverTask:  (id)  => set({ dragOverTaskId: id }),
    dropOnColumn: (status, taskId) => {
      const id = taskId ?? get().dragId
      if (!id) return
      set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, status } : t), dragId: null, dragOverCol: null, dragOverTaskId: null }))
      updateTarea(id, { estado: statusToEstado(status) })
    },
    dropOnTask: (targetId) => {
      const draggedId = get().dragId
      if (!draggedId || draggedId === targetId) {
        set({ dragId: null, dragOverTaskId: null, dragOverCol: null })
        return
      }
      const tasks   = get().tasks
      const dragged = tasks.find(t => t.id === draggedId)
      const target  = tasks.find(t => t.id === targetId)
      if (!dragged || !target) return

      const statusChanged  = dragged.status !== target.status
      const updatedDragged = statusChanged ? { ...dragged, status: target.status } : dragged

      const withoutDragged = tasks.filter(t => t.id !== draggedId)
      const targetIdx = withoutDragged.findIndex(t => t.id === targetId)
      const newTasks = [
        ...withoutDragged.slice(0, targetIdx),
        updatedDragged,
        ...withoutDragged.slice(targetIdx),
      ]
      set({ tasks: newTasks, dragId: null, dragOverTaskId: null, dragOverCol: null })

      if (statusChanged) {
        updateTarea(draggedId, { estado: statusToEstado(target.status) })
      }

      const affected = new Set([dragged.moduleId, target.moduleId])
      const items: ReorderItem[] = []
      affected.forEach(modId => {
        newTasks.filter(t => t.moduleId === modId).forEach((t, i) => {
          items.push({ taskId: t.id, moduloId: modId, orden: i })
        })
      })
      reorderTasks(get().activeTeamId, items)
    },

    setGanttZoom: (zoom)  => set({ ganttZoom: zoom, ganttOffset: 0 }),
    shiftGantt:   (delta) => set(s => ({ ganttOffset: s.ganttOffset + delta })),
    resetGantt:   ()      => set({ ganttOffset: 0 }),
    setColorBy:   (cb)    => set({ colorBy: cb }),

    startAddColumn:   ()     => set({ addingColumn: true, newColName: '', newColType: 'text' }),
    cancelAddColumn:  ()     => set({ addingColumn: false }),
    setNewColName:    (name) => set({ newColName: name }),
    setNewColType:    (type) => set({ newColType: type as ColType }),
    confirmAddColumn: async () => {
      const name = (get().newColName||'').trim()
      if (!name) { set({ addingColumn: false }); return }
      set({ addingColumn: false })
      const campo = await createCampo(get().activeTeamId, name, colTypeToTipoDato(get().newColType))
      set(s => ({
        customColumns: [...s.customColumns, { id: campo.id, name: campo.nombre, type: s.newColType }],
      }))
    },
    updateCustomCell: (taskId, colId, value) =>
      set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, custom: { ...(t.custom||{}), [colId]: value } } : t) })),
    saveCustomCell: (taskId, colId, value) => {
      setValorCampo(taskId, colId, value)
    },
    deleteColumn: async (colId) => {
      set(s => ({ customColumns: s.customColumns.filter(c => c.id !== colId) }))
      await deleteCampo(colId)
    },

    freezeBaseline: async () => {
      const planId = get().activeTeamId
      if (!planId) return
      await freezeBaselinePlan(planId)
      await get().loadPlanData(planId)
    },

    addModule: async () => {
      const planId = get().activeTeamId
      const m = await createModulo(planId, 'Nuevo módulo')
      set(s => ({
        modules: [...s.modules, { id: m.id, teamId: planId, name: m.nombre, color: colorFromId(m.id) }],
      }))
    },
    updateModuleName: async (id, name) => {
      set(s => ({ modules: s.modules.map(m => m.id === id ? { ...m, name } : m) }))
      await updateModulo(id, { nombre: name })
    },
    updateModuleColor: async (id, color) => {
      set(s => ({ modules: s.modules.map(m => m.id === id ? { ...m, color } : m) }))
      await updateModulo(id, { color })
    },
    deleteModule: async (id) => {
      set(s => ({ modules: s.modules.filter(m => m.id !== id) }))
      await deleteModulo(id)
    },

    updateMemberHours: async (id, hours) => {
      set(s => ({ members: s.members.map(m => m.id === id ? { ...m, hoursPerDay: hours } : m) }))
      await updatePlanMemberHours(get().activeTeamId, id, hours)
    },
    removeMember: async (id) => {
      const teamId = get().activeTeamId
      set(s => ({
        teams: s.teams.map(t => t.id === teamId ? { ...t, memberIds: t.memberIds.filter(x => x !== id) } : t),
      }))
      await removePlanMember(teamId, id)
    },

    addTeam: async () => {
      const plan = await createPlan('Nuevo equipo')
      set(s => ({
        teams: [...s.teams, { id: plan.id, name: plan.nombre, color: colorFromId(plan.id), memberIds: [] }],
      }))
    },
    updateTeamName: async (id, name) => {
      set(s => ({ teams: s.teams.map(t => t.id === id ? { ...t, name } : t) }))
      await updatePlanName(id, name)
    },
    deleteTeam: async (id) => {
      set(s => {
        if (s.teams.length <= 1) return s
        const teams = s.teams.filter(t => t.id !== id)
        return { teams, activeTeamId: s.activeTeamId === id ? teams[0].id : s.activeTeamId }
      })
      await deletePlan(id)
    },
    activateTeam: (id) => {
      set({ activeTeamId: id, section: 'tareas', collapsed: {} })
      get().loadPlanData(id)
    },
    addTeamMember: async (teamId, memberId) => {
      if (!memberId) return
      const updatedMembers = await addPlanMember(teamId, memberId)
      set(s => ({
        teams:   s.teams.map(t => t.id === teamId ? { ...t, memberIds: updatedMembers.map(m => m.id) } : t),
        members: [
          ...s.members.filter(m => !updatedMembers.find(u => u.id === m.id)),
          ...updatedMembers.map(m => ({ id: m.id, name: m.nombre, hoursPerDay: m.horasPorDia, color: colorFromId(m.id) })),
        ],
      }))
    },
    removeTeamMember: async (teamId, memberId) => {
      set(s => ({
        teams: s.teams.map(t => t.id === teamId ? { ...t, memberIds: t.memberIds.filter(x => x !== memberId) } : t),
      }))
      await removePlanMember(teamId, memberId)
    },
  })
)
