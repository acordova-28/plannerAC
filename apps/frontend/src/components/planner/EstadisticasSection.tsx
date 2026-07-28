import { useEffect, useState } from 'react'
import { getEstadisticas, EstadisticasDto } from '../../api/estadisticas.api'

const ESTADO_COLORS: Record<string, string> = {
  'Pendiente':   '#94a3b8',
  'En progreso': '#3b5bdb',
  'Bloqueado':   '#dc2626',
  'Completado':  '#16a34a',
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

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, animation:'secFadeUp .35s cubic-bezier(.16,1,.3,1) both' }}>
      <header style={{ flexShrink:0, background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 24px', height:62, display:'flex', alignItems:'center' }}>
        <div style={{ fontSize:16.5, fontWeight:700, color:'#0f172a', letterSpacing:'-.01em' }}>Estadísticas</div>
      </header>

      <div style={{ flex:1, minHeight:0, overflow:'auto', padding:'24px' }}>
        {loading && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:12, color:'#94a3b8', fontSize:13 }}>
            <div style={{ width:24, height:24, border:'2px solid #e2e8f0', borderTopColor:'#4c6ef5', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
            Cargando estadísticas…
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}
        {error && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#dc2626', fontSize:13 }}>
            Error al cargar estadísticas: {error}
          </div>
        )}
        {data && (
          <div style={{ maxWidth:900, display:'flex', flexDirection:'column', gap:20 }}>

            {/* KPI cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
              <KpiCard label="Total tareas"   value={String(data.totalTareas)}        sub="en el proyecto" />
              <KpiCard label="Horas estimadas" value={`${data.horasEstimadas} h`}     sub="suma total" />
              <KpiCard label="Baseline"        value={data.horasBaseline !== null ? `${data.horasBaseline} h` : '—'} sub="horas fijadas" />
              <KpiCard label="Avance"
                value={`${data.porcentajeAvance}%`}
                sub="tareas completadas"
                highlight={data.porcentajeAvance >= 75 ? 'green' : data.porcentajeAvance >= 40 ? 'blue' : undefined}
              />
            </div>

            {/* Progress bar */}
            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'18px 20px' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:10 }}>Progreso general</div>
              <div style={{ background:'#f1f5f9', borderRadius:999, height:10, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${data.porcentajeAvance}%`, background:'#16a34a', borderRadius:999, transition:'width .4s' }} />
              </div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:6 }}>{data.porcentajeAvance}% completado</div>
            </div>

            {/* Breakdown grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
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

function KpiCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: 'green' | 'blue' }) {
  const valueColor = highlight === 'green' ? '#16a34a' : highlight === 'blue' ? '#3b5bdb' : '#0f172a'
  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'18px 20px', boxShadow:'0 4px 16px rgba(15,23,42,.08)' }}>
      <div style={{ fontSize:11.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color:valueColor, lineHeight:1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:12, color:'#94a3b8' }}>{sub}</div>
    </div>
  )
}

function BreakdownCard({ title, data, colors, total }: { title: string; data: Record<string, number>; colors?: Record<string, string>; total: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const max = Math.max(...entries.map(e => e[1]), 1)

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'18px 20px', boxShadow:'0 4px 16px rgba(15,23,42,.08)' }}>
      <div style={{ fontSize:12, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:14 }}>{title}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {entries.length === 0 && <div style={{ fontSize:12, color:'#94a3b8' }}>Sin datos</div>}
        {entries.map(([key, count]) => {
          const pct = Math.round((count / total) * 100)
          const barPct = Math.round((count / max) * 100)
          const color = colors?.[key] || '#3b5bdb'
          return (
            <div key={key}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, color:'#334155', marginBottom:3 }}>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>{key}</span>
                <span style={{ color:'#64748b', flexShrink:0 }}>{count} · {pct}%</span>
              </div>
              <div style={{ background:'#f1f5f9', borderRadius:999, height:6 }}>
                <div style={{ height:'100%', width:`${barPct}%`, background:color, borderRadius:999 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
