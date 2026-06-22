import { useEffect } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { useComputedTasks } from '../hooks/useComputedTasks'
import { useFilters } from '../hooks/useFilters'
import Header from '../components/shared/Header'
import Filters from '../components/shared/Filters'
import ViewToggle from '../components/shared/ViewToggle'
import TaskSlideOver from '../components/shared/TaskSlideOver'
import GanttView from '../components/gantt/GanttView'
import KanbanView from '../components/kanban/KanbanView'

export default function Planner() {
  const tasks        = useTaskStore(s => s.tasks)
  const status       = useTaskStore(s => s.status)
  const config       = useTaskStore(s => s.config)
  const filters      = useTaskStore(s => s.filters)
  const view         = useTaskStore(s => s.view)
  const activeTaskId = useTaskStore(s => s.activeTaskId)
  const loadTasks    = useTaskStore(s => s.loadTasks)

  useEffect(() => { loadTasks() }, [loadTasks])

  const computed   = useComputedTasks(tasks, config)
  const filtered   = useFilters(computed, filters)
  const activeTask = computed.find(t => t.id === activeTaskId) ?? null

  if (status === 'loading' && tasks.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-500 text-sm">
        Cargando tareas...
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="h-screen flex items-center justify-center text-red-500 text-sm">
        Error al cargar las tareas. Recarga la página.
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <Header computed={computed} />

      <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-slate-200">
        <ViewToggle />
        <Filters tasks={computed} />
      </div>

      <div className="flex-1 overflow-hidden">
        {view === 'gantt'
          ? <GanttView tasks={filtered} />
          : <KanbanView tasks={filtered} />
        }
      </div>

      {activeTask && <TaskSlideOver task={activeTask} />}
    </div>
  )
}
