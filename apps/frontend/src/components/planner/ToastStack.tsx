import { useEffect } from 'react'
import { usePlannerStore } from '../../store/usePlannerStore'

function ToastItem({ id, message }: { id: string; message: string }) {
  const dismissToast = usePlannerStore(s => s.dismissToast)

  useEffect(() => {
    const t = setTimeout(() => dismissToast(id), 4000)
    return () => clearTimeout(t)
  }, [id, dismissToast])

  return (
    <div
      role="alert"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', border: '1px solid #fecaca', borderRadius: 12,
        padding: '12px 14px', boxShadow: '0 8px 24px rgba(15,23,42,.14)',
        fontSize: 13, color: '#7f1d1d', minWidth: 280, maxWidth: 380,
        animation: 'toastIn .22s cubic-bezier(.16,1,.3,1) both',
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => dismissToast(id)}
        aria-label="Cerrar aviso"
        style={{ display: 'flex', background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: 2, flexShrink: 0 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18"/><path d="M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}

export default function ToastStack() {
  const toasts = usePlannerStore(s => s.toasts)
  if (!toasts.length) return null

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 2000 }}>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }`}</style>
      {toasts.map(t => <ToastItem key={t.id} id={t.id} message={t.message} />)}
    </div>
  )
}
