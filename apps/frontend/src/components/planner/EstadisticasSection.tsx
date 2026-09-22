import { useEffect, useState } from 'react'
import { getEstadisticas, EstadisticasDto } from '../../api/estadisticas.api'

const ESTADO_COLORS: Record<string, string> = {
  'Pendiente':   '#94a3b8',
  'En progreso': '#3b5bdb',
  'Bloqueado':   '#dc2626',
  'Completado':  '#16a34a',
}

function progressTone(pct: number) {
  if (pct >= 75) return { text: '#16a34a', bar: '#16a34a' }
  if (pct >= 40) return { text: '#3b5bdb', bar: '#3b5bdb' }
  return { text: '#d97706', bar: '#f59f0b' }
}

export default function EstadisticasSection() {
  const [data,    setData]    = useState<EstadisticasDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    getEstadisticas()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const tone = data ? progressTone(data.porcentajeAvance) : progressTone(0)

  return (
    <div
      style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, animation:'secFadeUp .35s cubic-bezier(.16,1,.3,1) both' }}
      onAnimationEnd={e => { if (e.target === e.currentTarget) e.currentTarget.style.animation = 'none' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <header style={{ flexShrink:0, background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 24px', height:62, display:'flex', alignItems:'center' }}>
        <div style={{ fontSize:16.5, fontWeight:700, color:'#0f172a', letterSpacing:'-.01em' }}>Estadísticas</div>
      </header>

      <div style={{ flex:1, minHeight:0, overflow:'auto', padding:'clamp(16px, 3vw, 28px)', display:'flex', flexDirection:'column' }}>
        {loading && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:12, color:'#64748b', fontSize:13 }}>
            <div style={{ width:24, height:24, border:'2px solid #e2e8f0', borderTopColor:'#4c6ef5', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
            Cargando estadísticas…
          </div>
        )}
        {error && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626', fontSize:13 }}>
            Error al cargar estadísticas: {error}
          </div>
        )}
        {data && (
          <div style={{ maxWidth:1600, width:'100%', margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>

            {/* Hero: avance + KPIs en una sola franja, sin repetir el % dos veces */}
            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:'28px 32px', boxShadow:'0 8px 24px rgba(15,23,42,.06)', display:'flex', flexWrap:'wrap', gap:'28px 40px', alignItems:'center' }}>

              <div style={{ flex:'1 1 300px', minWidth:260 }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:12 }}>
                  Progreso general
                </div>
                <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:16 }}>
                  <span style={{ fontSize:'clamp(38px, 4.5vw, 56px)', fontWeight:800, lineHeight:1, color:tone.text, letterSpacing:'-.02em' }}>
                    {data.porcentajeAvance}%
                  </span>
                  <span style={{ fontSize:13.5, color:'#64748b' }}>completado</span>
                </div>
                <div style={{ background:'#f1f5f9', borderRadius:999, height:12, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:'100%', background:tone.bar, borderRadius:999, transformOrigin:'left center', transform:`scaleX(${data.porcentajeAvance / 100})`, transition:'transform .5s cubic-bezier(.16,1,.3,1)' }} />
                </div>
              </div>

              <div style={{ display:'flex', flexWrap:'wrap', gap:'20px 44px', flex:'2 1 380px' }}>
                <Stat label="Total tareas" value={String(data.totalTareas)} />
                <Stat label="Horas estimadas" value={`${data.horasEstimadas} h`} />
                <Stat label="Baseline" value={data.horasBaseline !== null ? `${data.horasBaseline} h` : '—'} />
              </div>

            </div>

            {/* Desglose — se reacomoda solo según el ancho disponible */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:20 }}>
              <BreakdownCard title="Por estado"      data={data.porEstado}      colors={ESTADO_COLORS} total={data.totalTareas} />
              <BreakdownCard title="Por módulo"      data={data.porModulo}      total={data.totalTareas} />
              <BreakdownCard title="Por responsable" data={data.porResponsable} total={data.totalTareas} />
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth:110 }}>
      <div style={{ fontSize:23, fontWeight:700, color:'#0f172a', lineHeight:1.15, marginBottom:4, letterSpacing:'-.01em' }}>{value}</div>
      <div style={{ fontSize:12, color:'#64748b' }}>{label}</div>
    </div>
  )
}

function BreakdownCard({ title, data, colors, total }: { title: string; data: Record<string, number>; colors?: Record<string, string>; total: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const max = Math.max(...entries.map(e => e[1]), 1)

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:'20px 22px', boxShadow:'0 8px 24px rgba(15,23,42,.06)' }}>
      <div style={{ fontSize:12.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:16 }}>{title}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {entries.length === 0 && <div style={{ fontSize:12.5, color:'#64748b' }}>Sin datos</div>}
        {entries.map(([key, count]) => {
          const pct = Math.round((count / total) * 100)
          const barPct = Math.round((count / max) * 100)
          const color = colors?.[key] || '#3b5bdb'
          return (
            <div key={key}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, color:'#334155', marginBottom:4 }}>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>{key}</span>
                <span style={{ color:'#64748b', flexShrink:0 }}>{count} · {pct}%</span>
              </div>
              <div style={{ background:'#f1f5f9', borderRadius:999, height:7 }}>
                <div style={{ height:'100%', width:`${barPct}%`, background:color, borderRadius:999 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
