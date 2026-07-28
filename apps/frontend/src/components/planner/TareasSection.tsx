import { useNavigate, useParams } from 'react-router-dom'
import { usePlannerStore, PlannerView } from '../../store/usePlannerStore'
import PlannerTableView  from './PlannerTableView'
import PlannerKanbanView from './PlannerKanbanView'
import PlannerGanttView  from './PlannerGanttView'

const VIEWS: { value: PlannerView; label: string; icon: React.ReactNode }[] = [
  {
    value: 'table', label: 'Tabla',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>,
  },
  {
    value: 'kanban', label: 'Kanban',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
  },
  {
    value: 'gantt', label: 'Gantt',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h10"/><path d="M6 12h9"/><path d="M11 18h7"/></svg>,
  },
]

const VIEW_TO_SECTION: Record<PlannerView, string> = {
  table: 'tareas', kanban: 'kanban', gantt: 'gantt',
}

export default function TareasSection() {
  const navigate        = useNavigate()
  const { planId }      = useParams<{ planId?: string }>()
  const view            = usePlannerStore(s => s.view)
  const teams           = usePlannerStore(s => s.teams)
  const activeTeamId    = usePlannerStore(s => s.activeTeamId)
  const activeTeam      = teams.find(t => t.id === activeTeamId) || teams[0]
  const openNewTask     = usePlannerStore(s => s.openNewTask)
  const freezeBaseline  = usePlannerStore(s => s.freezeBaseline)

  const id = planId || activeTeamId

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, animation:'secFadeUp .35s cubic-bezier(.16,1,.3,1) both' }}>
      {/* Section header */}
      <header style={{ flexShrink:0, background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 24px', height:62, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:16.5, fontWeight:700, color:'#0f172a', letterSpacing:'-.01em', lineHeight:1.1 }}>Tareas</div>
          <div style={{ fontSize:12, color:'#64748b' }}>{activeTeam.name}</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:14 }}>
          {/* View toggle */}
          <div style={{ display:'flex', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:9, padding:3, gap:2 }}>
            {VIEWS.map(v => {
              const on = view === v.value
              return (
                <button
                  key={v.value}
                  onClick={() => navigate(`/${id}/${VIEW_TO_SECTION[v.value]}`)}
                  style={{
                    display:'flex', alignItems:'center', gap:6,
                    background: on ? '#fff' : 'transparent',
                    color: on ? '#0f172a' : '#64748b',
                    border:'none', borderRadius:7, padding:'7px 13px',
                    fontSize:13, fontWeight:600, cursor:'pointer',
                    boxShadow: on ? '0 1px 2px rgba(15,23,42,.12)' : 'none',
                  }}
                >
                  {v.icon}
                  {v.label}
                </button>
              )
            })}
          </div>

          {/* Freeze baseline */}
          <button
            onClick={() => freezeBaseline()}
            title="Guarda las horas actuales como baseline de referencia"
            style={{ display:'flex', alignItems:'center', gap:7, background:'#fff', color:'#475569', border:'1px solid #e2e8f0', borderRadius:9, padding:'9px 15px', fontSize:13, fontWeight:600, cursor:'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            Fijar baseline
          </button>

          {/* New task */}
          <button
            onClick={() => openNewTask('todo')}
            style={{ display:'flex', alignItems:'center', gap:7, background:'#3b5bdb', color:'#fff', border:'none', borderRadius:9, padding:'9px 15px', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(59,91,219,.35)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Nueva tarea
          </button>
        </div>
      </header>

      {/* View content */}
      <div style={{ flex:1, minHeight:0, overflow:'auto' }}>
        {view === 'table'  && <PlannerTableView />}
        {view === 'kanban' && <PlannerKanbanView />}
        {view === 'gantt'  && <PlannerGanttView />}
      </div>
    </div>
  )
}
