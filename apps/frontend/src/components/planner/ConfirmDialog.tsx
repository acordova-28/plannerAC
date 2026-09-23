import { useEffect, useRef } from 'react'
import { usePlannerStore } from '../../store/usePlannerStore'

export default function ConfirmDialog() {
  const req            = usePlannerStore(s => s.confirmRequest)
  const resolveConfirm = usePlannerStore(s => s.resolveConfirm)
  const confirmBtnRef  = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!req) return
    confirmBtnRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolveConfirm(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [req, resolveConfirm])

  if (!req) return null

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000, animation:'cdFadeIn .15s ease both' }}
      onClick={() => resolveConfirm(false)}
    >
      <style>{`
        @keyframes cdFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes cdPopIn  { from { opacity:0; transform:scale(.96) translateY(6px) } to { opacity:1; transform:scale(1) translateY(0) } }
      `}</style>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={e => e.stopPropagation()}
        style={{ background:'#fff', borderRadius:16, padding:'24px 24px 20px', width:380, maxWidth:'calc(100vw - 32px)', boxShadow:'0 24px 64px rgba(15,23,42,.28)', animation:'cdPopIn .18s cubic-bezier(.16,1,.3,1) both' }}
      >
        <div style={{ display:'flex', gap:14, marginBottom:18 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </div>
          <div>
            <div id="confirm-dialog-title" style={{ fontSize:15.5, fontWeight:700, color:'#0f172a', marginBottom:4 }}>{req.title}</div>
            <div style={{ fontSize:13, color:'#64748b', lineHeight:1.5 }}>{req.message}</div>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button
            onClick={() => resolveConfirm(false)}
            style={{ padding:'9px 16px', border:'1px solid #e2e8f0', background:'#fff', borderRadius:9, fontSize:13, fontWeight:600, color:'#475569', cursor:'pointer' }}
          >
            Cancelar
          </button>
          <button
            ref={confirmBtnRef}
            onClick={() => resolveConfirm(true)}
            style={{ padding:'9px 16px', border:'none', background:'#dc2626', color:'#fff', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(220,38,38,.3)' }}
          >
            {req.confirmLabel ?? 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
