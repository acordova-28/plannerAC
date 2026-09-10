import { usePlannerStore, PALETTE } from '../../store/usePlannerStore'

export default function ModulosSection() {
  const modules          = usePlannerStore(s => s.modules)
  const activeTeamId     = usePlannerStore(s => s.activeTeamId)
  const teamModules      = modules.filter(m => m.teamId === activeTeamId)
  const allTasks         = usePlannerStore(s => s.tasks)
  const teamTasks        = allTasks.filter(t => t.teamId === activeTeamId)
  const teams            = usePlannerStore(s => s.teams)
  const activeTeam       = teams.find(t => t.id === activeTeamId) || teams[0]
  const addModule        = usePlannerStore(s => s.addModule)
  const updateModuleName = usePlannerStore(s => s.updateModuleName)
  const updateModuleColor= usePlannerStore(s => s.updateModuleColor)
  const deleteModule     = usePlannerStore(s => s.deleteModule)

  return (
    <div
      style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, animation:'secFadeUp .35s cubic-bezier(.16,1,.3,1) both' }}
      onAnimationEnd={e => { if (e.target === e.currentTarget) e.currentTarget.style.animation = 'none' }}
    >
      <SectionHeader title="Módulos" subtitle={activeTeam.name} />
      <div style={{ flex:1, overflow:'auto' }}>
        <div style={{ padding:24, maxWidth:760 }}>
          <div style={{ display:'flex', alignItems:'center', marginBottom:18 }}>
            <p style={{ margin:0, fontSize:13, color:'#64748b' }}>Organiza las tareas en grupos. El color se usa en Kanban y Gantt.</p>
            <button onClick={addModule} style={addBtnStyle}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Nuevo módulo
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {teamModules.map(m => {
              const count = teamTasks.filter(t => t.moduleId === m.id).length
              return (
                <div key={m.id} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:11, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, boxShadow:'0 4px 16px rgba(15,23,42,.08)' }}>
                  {/* Color swatches */}
                  <div style={{ display:'flex', gap:5 }}>
                    {PALETTE.map(c => (
                      <button
                        key={c}
                        onClick={() => updateModuleColor(m.id, c)}
                        style={{ width:20, height:20, borderRadius:6, cursor:'pointer', background:c, border:'none', outline: m.color === c ? '2px solid #0f172a' : '1px solid rgba(0,0,0,.08)', outlineOffset:1 }}
                      />
                    ))}
                  </div>
                  <input
                    value={m.name}
                    onChange={e => updateModuleName(m.id, e.target.value)}
                    style={{ flex:1, border:'1px solid transparent', borderRadius:7, padding:'7px 10px', fontSize:14, fontWeight:600, color:'#1e293b', background:'#f8fafc', outline:'none' }}
                  />
                  <span style={{ fontSize:12, color:'#64748b', fontWeight:500, whiteSpace:'nowrap' }}>{count} tareas</span>
                  <button onClick={() => deleteModule(m.id)} style={deleteBtnStyle}>
                    <TrashIcon />
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

export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header style={{ flexShrink:0, background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 24px', height:62, display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:16.5, fontWeight:700, color:'#0f172a', letterSpacing:'-.01em', lineHeight:1.1 }}>{title}</div>
        <div style={{ fontSize:12, color:'#64748b' }}>{subtitle}</div>
      </div>
    </header>
  )
}

const addBtnStyle: React.CSSProperties = { marginLeft:'auto', display:'flex', alignItems:'center', gap:7, background:'#3b5bdb', color:'#fff', border:'none', borderRadius:9, padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }
const deleteBtnStyle: React.CSSProperties = { display:'flex', padding:7, background:'#fff', border:'1px solid #fecaca', borderRadius:7, cursor:'pointer' }
function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
}
