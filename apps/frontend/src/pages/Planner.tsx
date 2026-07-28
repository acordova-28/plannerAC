import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlannerStore, NavSection } from '../store/usePlannerStore'
import PlannerSidebar   from '../components/planner/PlannerSidebar'
import TareasSection    from '../components/planner/TareasSection'
import ModulosSection   from '../components/planner/ModulosSection'
import MiembrosSection  from '../components/planner/MiembrosSection'
import EquiposSection       from '../components/planner/EquiposSection'
import EstadisticasSection  from '../components/planner/EstadisticasSection'
import TaskModal            from '../components/planner/TaskModal'
import AddColumnModal   from '../components/planner/AddColumnModal'

const VALID_SECTIONS: NavSection[] = ['tareas', 'kanban', 'gantt', 'modulos', 'miembros', 'equipos', 'stats', 'config']

export default function Planner() {
  const { planId, section: sectionParam } = useParams<{ planId?: string; section?: string }>()
  const navigate = useNavigate()

  const section: NavSection = VALID_SECTIONS.includes(sectionParam as NavSection)
    ? (sectionParam as NavSection)
    : 'tareas'

  const modalOpen      = usePlannerStore(s => s.modalOpen)
  const addingColumn   = usePlannerStore(s => s.addingColumn)
  const loadPlans      = usePlannerStore(s => s.loadPlans)
  const setActiveTeam  = usePlannerStore(s => s.setActiveTeam)
  const setView        = usePlannerStore(s => s.setView)
  const status         = usePlannerStore(s => s.status)
  const teams          = usePlannerStore(s => s.teams)
  const activeTeamId   = usePlannerStore(s => s.activeTeamId)

  // Sync store view when URL section changes
  useEffect(() => {
    if (section === 'kanban') setView('kanban')
    else if (section === 'gantt') setView('gantt')
    else if (section === 'tareas') setView('table')
  }, [section])

  // Initial load — prefer the planId from the URL
  useEffect(() => { loadPlans(planId) }, [])

  // After plans load: redirect to canonical URL if planId is missing or invalid
  useEffect(() => {
    if (status !== 'idle' || teams.length === 0) return
    if (!planId) {
      navigate(`/${activeTeamId}/${section}`, { replace: true })
    } else if (!teams.some(t => t.id === planId)) {
      navigate(`/${teams[0].id}/${section}`, { replace: true })
    }
  }, [status, teams.length])

  // When planId changes in URL (e.g. browser back/forward), sync store
  useEffect(() => {
    if (planId && teams.length > 0 && planId !== activeTeamId && teams.some(t => t.id === planId)) {
      setActiveTeam(planId)
    }
  }, [planId])

  if (status === 'error') return <ErrorScreen onRetry={loadPlans} />
  if (teams.length === 0) return <LoadingScreen />

  return (
    <div style={{ display:'flex', height:'100vh', width:'100%', overflow:'hidden', background:'#f1f5f9' }}>
      <PlannerSidebar />

      <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', background:'#f8fafc' }}>
        {(section === 'tareas' || section === 'kanban' || section === 'gantt') && <TareasSection />}
        {section === 'modulos'  && <ModulosSection />}
        {section === 'miembros' && <MiembrosSection />}
        {section === 'equipos'  && <EquiposSection />}
        {section === 'stats'    && <EstadisticasSection />}
        {section === 'config'   && <ConfigSection />}
      </main>

      {modalOpen    && <TaskModal />}
      {addingColumn && <AddColumnModal />}
    </div>
  )
}

function LoadingScreen() {
  const bars = [
    { width: '72%', delay: '0s',    color: '#3b5bdb' },
    { width: '45%', delay: '0.15s', color: '#4c6ef5' },
    { width: '88%', delay: '0.3s',  color: '#3b5bdb' },
    { width: '55%', delay: '0.45s', color: '#748ffc' },
    { width: '63%', delay: '0.6s',  color: '#4c6ef5' },
  ]
  return (
    <div style={{ display:'flex', height:'100vh', width:'100%', alignItems:'center', justifyContent:'center', background:'#f8fafc', flexDirection:'column' }}>
      <style>{`
        @keyframes ls-bar  { from { width: 0; opacity: 0 } to { opacity: 1 } }
        @keyframes ls-fade { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes ls-dot  { 0%,80%,100% { opacity: .25 } 40% { opacity: 1 } }
      `}</style>

      {/* Icon */}
      <div style={{ marginBottom: 32, animation: 'ls-fade .5s ease both' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#3b5bdb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(59,91,219,.35)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>
          </svg>
        </div>
      </div>

      {/* Gantt bars */}
      <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 28 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ height: 10, background: '#e9ecef', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: b.width,
              background: b.color,
              borderRadius: 6,
              animation: `ls-bar .6s cubic-bezier(.2,.8,.2,1) ${b.delay} both`,
            }} />
          </div>
        ))}
      </div>

      {/* Text */}
      <div style={{ animation: 'ls-fade .5s ease .6s both', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#94a3b8' }}>
        Cargando
        {[0, 1, 2].map(i => (
          <span key={i} style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#94a3b8', animation: `ls-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ display:'flex', height:'100vh', width:'100%', alignItems:'center', justifyContent:'center', background:'#f8fafc', flexDirection:'column', gap:12 }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div style={{ fontSize:15, fontWeight:600, color:'#475569' }}>No se pudieron cargar los datos</div>
      <div style={{ fontSize:13, color:'#94a3b8' }}>Verifica tu conexión o contacta al administrador.</div>
      <button
        onClick={onRetry}
        style={{ marginTop:8, padding:'8px 20px', background:'#1A5276', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}
      >
        Reintentar
      </button>
    </div>
  )
}

function ConfigSection() {
  return (
    <div style={{ padding:'48px 24px', maxWidth:560, margin:'0 auto', textAlign:'center', color:'#94a3b8' }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:14 }}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
      <div style={{ fontSize:15, fontWeight:600, color:'#475569' }}>Configuración del workspace</div>
      <div style={{ fontSize:13, marginTop:6 }}>Preferencias generales, notificaciones e integraciones aparecerían aquí.</div>
    </div>
  )
}
