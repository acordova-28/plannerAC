import { useState, useEffect, useRef } from 'react'
import {
  usePlannerStore, STATUS_META, STATUS_ORDER, TaskStatus,
} from '../../store/usePlannerStore'
import KanbanCard from '../kanban/KanbanCard'

interface DragInfo {
  cardId:  string
  offsetX: number
  offsetY: number
  width:   number
  height:  number
  startX:  number
  startY:  number
  moved:   boolean
}

export default function PlannerKanbanView() {
  const activeTeamId = usePlannerStore(s => s.activeTeamId)
  const allTasks     = usePlannerStore(s => s.tasks)
  const teamTasks    = allTasks.filter(t => t.teamId === activeTeamId)
  const members      = usePlannerStore(s => s.members)
  const modules      = usePlannerStore(s => s.modules)
  const setDragId    = usePlannerStore(s => s.setDragId)
  const dropOnColumn = usePlannerStore(s => s.dropOnColumn)
  const dropOnTask   = usePlannerStore(s => s.dropOnTask)
  const openTask     = usePlannerStore(s => s.openTask)
  const openNewTask  = usePlannerStore(s => s.openNewTask)

  // Refs — no re-render needed
  const dragRef       = useRef<DragInfo | null>(null)
  const dropTargetRef = useRef<{ col: TaskStatus | null; cardId: string | null }>({ col: null, cardId: null })
  const actionsRef    = useRef({ setDragId, dropOnColumn, dropOnTask, openTask })
  useEffect(() => { actionsRef.current = { setDragId, dropOnColumn, dropOnTask, openTask } })

  // State — triggers re-render
  const [dragPos,    setDragPos]    = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dropTarget, setDropTarget] = useState<{ col: TaskStatus | null; cardId: string | null }>({ col: null, cardId: null })

  // Global pointer handlers (set once)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return

      // Threshold: distinguish click from drag
      if (!drag.moved) {
        if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 5) return
        drag.moved = true
        setIsDragging(true)
        actionsRef.current.setDragId(drag.cardId)
      }

      setDragPos({ x: e.clientX, y: e.clientY })

      // Hit-test what's under the cursor.
      // The floating card has pointer-events:none so it's transparent to this call.
      const els = document.elementsFromPoint(e.clientX, e.clientY) as HTMLElement[]
      const colEl  = els.find(el => el.dataset?.status)
      const cardEl = els.find(el => el.dataset?.cardId && el.dataset.cardId !== drag.cardId)

      const target = {
        col:    (colEl?.dataset.status  as TaskStatus) ?? null,
        cardId: cardEl?.dataset.cardId ?? null,
      }
      dropTargetRef.current = target
      setDropTarget(target)
    }

    const onUp = () => {
      const drag = dragRef.current
      if (!drag) return

      if (drag.moved) {
        const { col, cardId } = dropTargetRef.current
        if (cardId)   actionsRef.current.dropOnTask(cardId)
        else if (col) actionsRef.current.dropOnColumn(col)
        actionsRef.current.setDragId(null)
      } else {
        // Short press without movement = click
        actionsRef.current.openTask(drag.cardId)
      }

      dragRef.current = null
      setIsDragging(false)
      const empty = { col: null, cardId: null }
      dropTargetRef.current = empty
      setDropTarget(empty)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
  }, [])

  const startDrag = (e: React.PointerEvent, cardId: string) => {
    if (e.button !== 0) return
    const el = e.currentTarget as HTMLElement
    // Anular momentáneamente el transform de :hover antes de medir: la tarjeta
    // flotante (.k-floating) nunca lo aplica, así que si se mide con el hover
    // activo (translateY -2px, scale 1.01), el offset cursor→tarjeta queda mal
    // calculado y la tarjeta flotante no se alinea con el puntero durante el drag.
    const prevTransform = el.style.transform
    el.style.transform = 'none'
    const rect = el.getBoundingClientRect()
    el.style.transform = prevTransform
    dragRef.current = {
      cardId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width:   rect.width,
      height:  rect.height,
      startX:  e.clientX,
      startY:  e.clientY,
      moved:   false,
    }
    setDragPos({ x: e.clientX, y: e.clientY })
    e.preventDefault()
  }

  const draggingTask = isDragging && dragRef.current
    ? teamTasks.find(t => t.id === dragRef.current!.cardId) ?? null
    : null

  return (
    <div
      style={{
        padding: '22px 24px',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        minWidth: 'max-content',
        position: 'relative',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {STATUS_ORDER.map(status => {
        const meta    = STATUS_META[status]
        const cards   = teamTasks.filter(t => t.status === status)
        const colOver = dropTarget.col === status && !dropTarget.cardId

        return (
          <div
            key={status}
            data-status={status}
            style={{
              width: 288, flexShrink: 0, borderRadius: 12, padding: 12,
              display: 'flex', flexDirection: 'column', gap: 10,
              background: colOver ? '#eef3ff' : '#f1f5f9',
              boxShadow: colOver ? 'inset 0 0 0 2px #748ffc' : 'inset 0 0 0 1px transparent',
              transition: 'background .18s, box-shadow .18s',
            }}
          >
            {/* Column header */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'2px 4px' }}>
              <span style={{ width:9, height:9, borderRadius:'50%', background:meta.dot, flexShrink:0 }} />
              <span style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>{meta.label}</span>
              <span style={{ fontSize:11, color:'#64748b', background:'#e2e8f0', padding:'1px 8px', borderRadius:20, fontWeight:600, marginLeft:2 }}>
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            {cards.flatMap(card => {
              const isBeingDragged = isDragging && card.id === dragRef.current?.cardId
              const isDropTarget   = dropTarget.cardId === card.id && !isBeingDragged
              const items: React.ReactNode[] = []

              // Drop insertion placeholder above this card
              if (isDropTarget && dragRef.current) {
                items.push(
                  <div key={card.id + '-ph'} className="k-drop-ph"
                    style={{ height: dragRef.current.height }} />
                )
              }

              // Card itself, or ghost slot for the card being dragged
              items.push(
                isBeingDragged
                  ? <div key={card.id} className="k-origin-ph"
                      style={{ height: dragRef.current?.height || 80 }} />
                  : <KanbanCard
                      key={card.id}
                      task={card}
                      members={members}
                      modules={modules}
                      onPointerDown={e => startDrag(e, card.id)}
                    />
              )

              return items
            })}

            {/* Column-level drop placeholder (end of column) */}
            {colOver && dragRef.current && (
              <div className="k-drop-ph" style={{ height: dragRef.current.height }} />
            )}

            {/* Add task */}
            <button
              onClick={() => openNewTask(status)}
              style={{ display:'flex', alignItems:'center', gap:7, width:'100%', background:'transparent', border:'1px dashed #cbd5e1', borderRadius:9, padding:9, fontSize:12.5, fontWeight:600, color:'#64748b', cursor:'pointer', transition:'border-color .15s, color .15s' }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = '#94a3b8'; el.style.color = '#475569' }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = '#cbd5e1'; el.style.color = '#64748b' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Añadir tarea
            </button>
          </div>
        )
      })}

      {/* ── Floating card that physically follows the cursor ── */}
      {draggingTask && dragRef.current && (
        <div
          style={{
            position: 'fixed',
            left: dragPos.x - dragRef.current.offsetX,
            top:  dragPos.y - dragRef.current.offsetY,
            width: dragRef.current.width,
            zIndex: 1000,
            pointerEvents: 'none',
            transformOrigin: `${dragRef.current.offsetX}px ${dragRef.current.offsetY}px`,
            animation: 'kLiftOff .18s cubic-bezier(.2,.8,.2,1) forwards',
          }}
        >
          <KanbanCard
            task={draggingTask}
            members={members}
            modules={modules}
            onPointerDown={() => {}}
            isFloating
          />
        </div>
      )}
    </div>
  )
}

