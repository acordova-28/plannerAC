import { usePlannerStore, initials } from '../../store/usePlannerStore'
import { SectionHeader } from './ModulosSection'

export default function MiembrosSection() {
  const teams            = usePlannerStore(s => s.teams)
  const activeTeamId     = usePlannerStore(s => s.activeTeamId)
  const members          = usePlannerStore(s => s.members)
  const allTasks         = usePlannerStore(s => s.tasks)
  const activeTeam       = teams.find(t => t.id === activeTeamId) || teams[0]
  const teamMembers      = members.filter(m => (activeTeam?.memberIds ?? []).includes(m.id))
  const teamTasks        = allTasks.filter(t => t.teamId === activeTeamId)
  const updateMemberHours= usePlannerStore(s => s.updateMemberHours)
  const removeMember     = usePlannerStore(s => s.removeMember)

  return (
    <div
      style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, animation:'secFadeUp .35s cubic-bezier(.16,1,.3,1) both' }}
      onAnimationEnd={e => { if (e.target === e.currentTarget) e.currentTarget.style.animation = 'none' }}
    >
      <SectionHeader title="Miembros" subtitle={activeTeam.name} />
      <div style={{ flex:1, overflow:'auto' }}>
        <div style={{ padding:24, maxWidth:780 }}>
          <div style={{ display:'flex', alignItems:'center', marginBottom:18 }}>
            <p style={{ margin:0, fontSize:13, color:'#64748b', maxWidth:480 }}>Las horas laborables por día definen cómo se calcula la fecha fin (días hábiles lun–vie). Para añadir miembros ve a la sección <strong>Mis Equipos</strong>.</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {teamMembers.map(m => {
              const taskCount = teamTasks.filter(t => t.assigneeId === m.id).length
              return (
                <div key={m.id} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:11, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, boxShadow:'0 4px 16px rgba(15,23,42,.08)' }}>
                  <span style={{ width:38, height:38, borderRadius:'50%', background:m.color, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff', flexShrink:0 }}>
                    {initials(m.name)}
                  </span>
                  <span style={{ flex:1, padding:'7px 10px', fontSize:14, fontWeight:600, color:'#1e293b' }}>
                    {m.name}
                  </span>
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:9, padding:'6px 12px' }}>
                    <input
                      type="number" min="1" max="12"
                      value={m.hoursPerDay}
                      onChange={e => updateMemberHours(m.id, Math.max(1, Math.min(12, parseInt(e.target.value||'8',10)||8)))}
                      style={{ width:42, border:'none', background:'transparent', fontSize:15, fontWeight:700, color:'#0f172a', textAlign:'center', outline:'none' }}
                    />
                    <span style={{ fontSize:12, color:'#64748b', fontWeight:500 }}>h / día</span>
                  </div>
                  <span style={{ fontSize:12, color:'#64748b', whiteSpace:'nowrap' }}>{taskCount} tareas</span>
                  <button onClick={() => removeMember(m.id)} style={{ display:'flex', padding:7, background:'#fff', border:'1px solid #fecaca', borderRadius:7, cursor:'pointer' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
