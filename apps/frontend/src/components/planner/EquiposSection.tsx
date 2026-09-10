import { usePlannerStore, initials } from '../../store/usePlannerStore'
import { SectionHeader } from './ModulosSection'

export default function EquiposSection() {
  const teams            = usePlannerStore(s => s.teams)
  const members          = usePlannerStore(s => s.members)
  const allUsers         = usePlannerStore(s => s.allUsers)
  const activeTeamId     = usePlannerStore(s => s.activeTeamId)
  const addTeam          = usePlannerStore(s => s.addTeam)
  const updateTeamName   = usePlannerStore(s => s.updateTeamName)
  const deleteTeam       = usePlannerStore(s => s.deleteTeam)
  const activateTeam     = usePlannerStore(s => s.activateTeam)
  const addTeamMember    = usePlannerStore(s => s.addTeamMember)
  const removeTeamMember = usePlannerStore(s => s.removeTeamMember)

  return (
    <div
      style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, animation:'secFadeUp .35s cubic-bezier(.16,1,.3,1) both' }}
      onAnimationEnd={e => { if (e.target === e.currentTarget) e.currentTarget.style.animation = 'none' }}
    >
      <SectionHeader title="Mis Equipos" subtitle="Administración" />
      <div style={{ flex:1, overflow:'auto' }}>
        <div style={{ padding:24, maxWidth:880 }}>
          <div style={{ display:'flex', alignItems:'center', marginBottom:18 }}>
            <p style={{ margin:0, fontSize:13, color:'#64748b', maxWidth:500 }}>Como admin puedes crear equipos y asignar miembros. Cada equipo tiene su propio workspace.</p>
            <button onClick={addTeam} style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:7, background:'#3b5bdb', color:'#fff', border:'none', borderRadius:9, padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Crear equipo
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))', gap:14 }}>
            {teams.map(team => {
              const isActive  = team.id === activeTeamId
              const memObjs   = team.memberIds.map(id => members.find(m => m.id === id)).filter(Boolean) as typeof members
              const available = allUsers.filter(m => !team.memberIds.includes(m.id))
              return (
                <div key={team.id} style={{ background:'#fff', border:'1px solid '+(isActive?'#93c5fd':'#e2e8f0'), borderRadius:12, padding:16, boxShadow: isActive?'0 0 0 3px rgba(37,99,235,.1)':'0 1px 2px rgba(15,23,42,.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:14 }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:team.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                      {initials(team.name)}
                    </div>
                    <input
                      value={team.name}
                      onChange={e => updateTeamName(team.id, e.target.value)}
                      style={{ flex:1, border:'1px solid transparent', borderRadius:7, padding:'6px 8px', fontSize:15, fontWeight:700, color:'#0f172a', background:'#f8fafc', outline:'none' }}
                    />
                    {isActive
                      ? <span style={{ fontSize:10, fontWeight:700, color:'#16a34a', background:'#dcfce7', padding:'3px 8px', borderRadius:6 }}>ACTIVO</span>
                      : <button onClick={() => activateTeam(team.id)} style={{ fontSize:11, fontWeight:600, color:'#2563eb', background:'#eff6ff', border:'1px solid #bfdbfe', padding:'4px 9px', borderRadius:6, cursor:'pointer' }}>Abrir</button>
                    }
                  </div>

                  <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'.04em', color:'#94a3b8', fontWeight:600, marginBottom:8 }}>Miembros</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {memObjs.map(m => (
                      <span key={m.id} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:20, padding:'3px 5px 3px 8px', fontSize:12, color:'#334155', fontWeight:500 }}>
                        <span style={{ width:20, height:20, borderRadius:'50%', background:m.color, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff', flexShrink:0 }}>
                          {initials(m.name)}
                        </span>
                        {m.name}
                        <button
                          onClick={() => removeTeamMember(team.id, m.id)}
                          style={{ display:'flex', padding:2, background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:8 }}>
                    <select
                      defaultValue=""
                      onChange={e => { addTeamMember(team.id, e.target.value); e.target.value = '' }}
                      style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:8, padding:'7px 10px', fontSize:12.5, color:'#475569', background:'#fff', outline:'none' }}
                    >
                      <option value="">+ Añadir miembro…</option>
                      {available.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <button onClick={() => deleteTeam(team.id)} style={{ display:'flex', padding:8, background:'#fff', border:'1px solid #fecaca', borderRadius:8, cursor:'pointer' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
