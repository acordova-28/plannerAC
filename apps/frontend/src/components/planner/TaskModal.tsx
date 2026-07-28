import { useState, useEffect } from 'react'
import {
  usePlannerStore, STATUS_META, STATUS_ORDER, PRIORITY_META,
  computeEndISO, fmtShort, parseISO, initials,
} from '../../store/usePlannerStore'

export default function TaskModal() {
  const draft        = usePlannerStore(s => s.draft)
  const activeTeamId = usePlannerStore(s => s.activeTeamId)
  const allModules   = usePlannerStore(s => s.modules)
  const teamModules  = allModules.filter(m => m.teamId === activeTeamId)
  const members      = usePlannerStore(s => s.members)
  const activeTeam   = usePlannerStore(s => s.activeTeam)()
  const teamMembers  = members.filter(m => (activeTeam?.memberIds ?? []).includes(m.id))
  const closeModal  = usePlannerStore(s => s.closeModal)
  const updateDraft = usePlannerStore(s => s.updateDraft)
  const saveDraft   = usePlannerStore(s => s.saveDraft)
  const deleteDraft = usePlannerStore(s => s.deleteDraft)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [closeModal])

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      await saveDraft()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Error al guardar la tarea')
    } finally {
      setSaving(false)
    }
  }

  if (!draft) return null

  const isEdit      = !!draft.id
  const assignee    = members.find(m => m.id === draft.assigneeId)
  const endISO      = computeEndISO(draft, members)
  const hpd         = assignee?.hoursPerDay || 8
  const days        = draft.durationHrs ? Math.max(1, Math.ceil(draft.durationHrs / hpd)) : 0
  const endLabel    = endISO ? fmtShort(parseISO(endISO)) : '—'
  const calcNote    = draft.startDate && draft.durationHrs
    ? `${draft.durationHrs}h ÷ ${hpd}h/día = ${days} día${days>1?'s':''} hábil${days>1?'es':''} (lun–vie)`
    : 'Define fecha de inicio y asignado'

  function change(field: string, value: unknown) { updateDraft(field, value) }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.5)', zIndex:50, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 20px', overflowY:'auto', animation:'ovIn .15s ease' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:'#fff', borderRadius:16, width:560, maxWidth:'100%', boxShadow:'0 24px 60px rgba(15,23,42,.35)', animation:'pnIn .22s cubic-bezier(.2,.8,.2,1)', overflow:'hidden' }}
      >
        {/* Header */}
        <div style={{ padding:'20px 24px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em' }}>
              {isEdit ? 'Editar tarea' : 'Nueva tarea'}
            </span>
            <button onClick={closeModal} style={{ marginLeft:'auto', display:'flex', padding:7, background:'#f1f5f9', border:'none', borderRadius:8, cursor:'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <input
            value={draft.name}
            onChange={e => change('name', e.target.value)}
            placeholder="Nombre de la tarea"
            style={{ width:'100%', border:'none', fontSize:21, fontWeight:700, color:'#0f172a', padding:'0 0 16px', letterSpacing:'-.01em', outline:'none' }}
          />
        </div>

        {/* Body */}
        <div style={{ padding:'0 24px 8px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 18px' }}>
          {/* Módulo */}
          <div>
            <label style={labelStyle}>Módulo</label>
            <select value={draft.moduleId} onChange={e => change('moduleId', e.target.value)} style={selectStyle}>
              {teamModules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* Asignado */}
          <div>
            <label style={labelStyle}>Asignado a</label>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:30, height:30, borderRadius:'50%', background:assignee?.color||'#cbd5e1', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {assignee ? initials(assignee.name) : '?'}
              </span>
              <select value={draft.assigneeId} onChange={e => change('assigneeId', e.target.value)} style={{ ...selectStyle, flex:1 }}>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.hoursPerDay}h/día)</option>)}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div style={{ gridColumn:'1 / -1' }}>
            <label style={labelStyle}>Descripción</label>
            <textarea
              value={draft.description}
              onChange={e => change('description', e.target.value)}
              placeholder="Describe la tarea…"
              rows={2}
              style={{ ...inputStyle, resize:'vertical' }}
            />
          </div>

          {/* Fecha inicio */}
          <div>
            <label style={labelStyle}>Fecha de inicio</label>
            <input type="date" value={draft.startDate||''} onChange={e => change('startDate', e.target.value||null)} style={inputStyle} />
          </div>

          {/* Duración */}
          <div>
            <label style={labelStyle}>Duración estimada (hrs)</label>
            <input
              type="number" min="0"
              value={draft.durationHrs}
              onChange={e => change('durationHrs', Math.max(0, parseInt(e.target.value||'0',10)||0))}
              style={inputStyle}
            />
          </div>

          {/* Fecha fin calculada */}
          <div style={{ gridColumn:'1 / -1', background:'#f0f7ff', border:'1px solid #dbeafe', borderRadius:10, padding:'11px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>Fecha fin: {endLabel}</div>
              <div style={{ fontSize:11.5, color:'#2563eb', marginTop:1 }}>{calcNote}</div>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label style={labelStyle}>Estado</label>
            <select value={draft.status} onChange={e => change('status', e.target.value)} style={selectStyle}>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>

          {/* Prioridad */}
          <div>
            <label style={labelStyle}>Prioridad</label>
            <select value={draft.priority} onChange={e => change('priority', e.target.value)} style={selectStyle}>
              {Object.entries(PRIORITY_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Notas */}
          <div style={{ gridColumn:'1 / -1' }}>
            <label style={labelStyle}>Notas / comentarios</label>
            <textarea
              value={draft.notes}
              onChange={e => change('notes', e.target.value)}
              placeholder="Añade notas o comentarios…"
              rows={2}
              style={{ ...inputStyle, resize:'vertical' }}
            />
          </div>
        </div>

        {/* Error banner */}
        {saveError && (
          <div style={{ margin:'0 24px 8px', padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, fontSize:12.5, color:'#dc2626' }}>
            {saveError}
          </div>
        )}

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 24px', borderTop:'1px solid #f1f5f9', marginTop:8 }}>
          {isEdit && (
            <button onClick={deleteDraft} style={{ display:'flex', alignItems:'center', gap:7, background:'#fff', color:'#dc2626', border:'1px solid #fecaca', borderRadius:9, padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Eliminar
            </button>
          )}
          <button onClick={closeModal} style={{ marginLeft:'auto', padding:'10px 16px', border:'1px solid #e2e8f0', background:'#fff', borderRadius:9, fontSize:13, fontWeight:600, color:'#475569', cursor:'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding:'10px 20px', border:'none', background: saving ? '#748ffc' : '#3b5bdb', color:'#fff', borderRadius:9, fontSize:13, fontWeight:600, cursor: saving ? 'default' : 'pointer', boxShadow:'0 1px 2px rgba(37,99,235,.3)' }}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display:'block', fontSize:11.5, fontWeight:600, color:'#64748b', marginBottom:6 }
const inputStyle: React.CSSProperties = { width:'100%', border:'1px solid #e2e8f0', borderRadius:9, padding:'9px 11px', fontSize:13.5, color:'#1e293b', outline:'none', background:'#fff', boxSizing:'border-box' }
const selectStyle: React.CSSProperties = { width:'100%', border:'1px solid #e2e8f0', borderRadius:9, padding:'9px 11px', fontSize:13.5, color:'#1e293b', background:'#fff', outline:'none' }

if (typeof document !== 'undefined' && !document.getElementById('planner-modal-css')) {
  const style = document.createElement('style')
  style.id = 'planner-modal-css'
  style.textContent = `
    @keyframes ovIn { from { opacity:0 } to { opacity:1 } }
    @keyframes pnIn { from { opacity:0; transform:translateY(8px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }
  `
  document.head.appendChild(style)
}
