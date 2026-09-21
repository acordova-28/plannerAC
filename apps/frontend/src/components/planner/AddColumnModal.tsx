import { usePlannerStore } from '../../store/usePlannerStore'

export default function AddColumnModal() {
  const newColName       = usePlannerStore(s => s.newColName)
  const newColType       = usePlannerStore(s => s.newColType)
  const cancelAddColumn  = usePlannerStore(s => s.cancelAddColumn)
  const setNewColName    = usePlannerStore(s => s.setNewColName)
  const setNewColType    = usePlannerStore(s => s.setNewColType)
  const confirmAddColumn = usePlannerStore(s => s.confirmAddColumn)

  return (
    <div onClick={cancelAddColumn} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.4)', zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', animation:'ovIn .15s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:14, padding:22, width:340, boxShadow:'0 20px 50px rgba(15,23,42,.3)', animation:'pnIn .2s ease' }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#0f172a', marginBottom:16 }}>Nueva columna</div>
        <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:6 }}>Nombre</label>
        <input
          value={newColName}
          onChange={e => setNewColName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && confirmAddColumn()}
          placeholder="Ej: Esfuerzo"
          autoFocus
          style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:9, padding:'9px 11px', fontSize:14, marginBottom:14, outline:'none', boxSizing:'border-box' }}
        />
        <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:6 }}>Tipo</label>
        <select
          value={newColType}
          onChange={e => setNewColType(e.target.value)}
          style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:9, padding:'9px 11px', fontSize:14, marginBottom:20, background:'#fff', outline:'none' }}
        >
          <option value="text">Texto</option>
          <option value="number">Número</option>
          <option value="date">Fecha</option>
          <option value="checkbox">Checkbox</option>
        </select>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={cancelAddColumn} style={{ flex:1, padding:10, border:'1px solid #e2e8f0', background:'#fff', borderRadius:9, fontSize:13, fontWeight:600, color:'#475569', cursor:'pointer' }}>Cancelar</button>
          <button onClick={confirmAddColumn} style={{ flex:1, padding:10, border:'none', background:'#2563eb', color:'#fff', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer' }}>Añadir</button>
        </div>
      </div>
    </div>
  )
}
