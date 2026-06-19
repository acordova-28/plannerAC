import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { ComputedTask, Estado } from '../../types'
import { useTaskStore } from '../../store/useTaskStore'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'
import { useState } from 'react'

const ESTADOS: Estado[] = [Estado.Pendiente, Estado.EnProgreso, Estado.Completado, Estado.Bloqueado]

interface Props { tasks: ComputedTask[] }

export default function KanbanView({ tasks }: Props) {
  const moveKanban              = useTaskStore(s => s.moveKanban)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const grouped = Object.fromEntries(
    ESTADOS.map(e => [e, tasks.filter(t => t.estado === e)])
  ) as Record<Estado, ComputedTask[]>

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const newEstado = over.id as Estado
    if (ESTADOS.includes(newEstado)) {
      moveKanban(active.id as string, newEstado)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={e => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 p-4 h-full overflow-x-auto overflow-y-hidden items-start">
        {ESTADOS.map(estado => (
          <KanbanColumn key={estado} estado={estado} tasks={grouped[estado]} />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-1 opacity-90 w-72">
            <KanbanCard task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
