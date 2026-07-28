import { useMemo } from 'react'
import {
  usePlannerStore, GanttZoom, ColorBy, STATUS_META, PlannerTask,
  parseISO, toISO, todayISO, fmtShort, dayDiff, computeEndISO,
} from '../../store/usePlannerStore'

const DAY_NAMES  = ['D','L','M','X','J','V','S']

function isWeekend(dt: Date) { const d = dt.getDay(); return d === 0 || d === 6 }

export default function PlannerGanttView() {
  const ganttZoom    = usePlannerStore(s => s.ganttZoom)
  const ganttOffset  = usePlannerStore(s => s.ganttOffset)
  const colorBy      = usePlannerStore(s => s.colorBy)
  const activeTeamId = usePlannerStore(s => s.activeTeamId)
  const allModules   = usePlannerStore(s => s.modules)
  const allTasks     = usePlannerStore(s => s.tasks)
  const teamModules  = allModules.filter(m => m.teamId === activeTeamId)
  const teamTasks    = allTasks.filter(t => t.teamId === activeTeamId)
  const members      = usePlannerStore(s => s.members)
  const shiftGantt   = usePlannerStore(s => s.shiftGantt)
  const resetGantt   = usePlannerStore(s => s.resetGantt)
  const setGanttZoom = usePlannerStore(s => s.setGanttZoom)
  const setColorBy   = usePlannerStore(s => s.setColorBy)
  const openTask     = usePlannerStore(s => s.openTask)

  const gantt = useMemo(() => buildGantt(ganttZoom, ganttOffset, teamModules, teamTasks, members, colorBy), [ganttZoom, ganttOffset, teamModules, teamTasks, members, colorBy])

  const prevDelta = ganttZoom === 'days' ? -7 : -28
  const nextDelta = ganttZoom === 'days' ?  7 :  28

  return (
    <div style={{ padding:'22px 24px' }}>
      {/* Controls */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4 }}>
          <button onClick={() => shiftGantt(prevDelta)} style={btnStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button onClick={resetGantt} style={{ height:34, padding:'0 14px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontSize:12.5, fontWeight:600, color:'#475569' }}>Hoy</button>
          <button onClick={() => shiftGantt(nextDelta)} style={btnStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{gantt.rangeLabel}</div>

        <div style={{ marginLeft:'auto', display:'flex', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, padding:3, gap:2 }}>
          <MiniBtn active={ganttZoom === 'days'}  onClick={() => setGanttZoom('days')}>Días</MiniBtn>
          <MiniBtn active={ganttZoom === 'weeks'} onClick={() => setGanttZoom('weeks')}>Semanas</MiniBtn>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11.5, color:'#64748b' }}>
          <span style={{ fontWeight:600 }}>Color:</span>
          <Chip active={colorBy === 'module'} onClick={() => setColorBy('module')}>Módulo</Chip>
          <Chip active={colorBy === 'status'} onClick={() => setColorBy('status')}>Estado</Chip>
        </div>
      </div>

      {/* Grid */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'auto', boxShadow:'0 1px 3px rgba(15,23,42,.04)' }}>
        <div style={{ position:'relative', width:'max-content', minWidth:'100%' }}>
          {/* Header row */}
          <div style={{ display:'flex', position:'sticky', top:0, zIndex:3, background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
            <div style={{ width:230, flexShrink:0, padding:'10px 16px', fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em', borderRight:'1px solid #e2e8f0', position:'sticky', left:0, background:'#f8fafc', zIndex:2 }}>
              Tarea
            </div>
            <div style={{ display:'flex' }}>
              {gantt.columns.map((col, i) => (
                <div key={i} style={col.style}>
                  <div style={{ fontWeight:600, color:'#475569' }}>{col.top}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{col.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Today line */}
          {gantt.showToday && (
            <div style={gantt.todayStyle}>
              <div style={{ position:'absolute', top:3, left:'50%', transform:'translateX(-50%)', background:'#ef4444', color:'#fff', fontSize:9.5, fontWeight:700, padding:'1px 6px', borderRadius:5, whiteSpace:'nowrap' }}>HOY</div>
            </div>
          )}

          {/* Module groups + task rows */}
          {gantt.rows.map(row => (
            <div key={row.id}>
              {/* Module header */}
              <div style={{ display:'flex', background:'#f8fafc', borderBottom:'1px solid #eef2f6' }}>
                <div style={{ width:230, flexShrink:0, padding:'7px 16px', display:'flex', alignItems:'center', gap:8, position:'sticky', left:0, background:'#f8fafc', zIndex:1, borderRight:'1px solid #e2e8f0' }}>
                  <span style={{ width:8, height:8, borderRadius:2, background:row.color, flexShrink:0 }} />
                  <span style={{ fontSize:12, fontWeight:700, color:'#334155' }}>{row.name}</span>
                </div>
                <div style={{ flexShrink:0, width:gantt.trackW, background:'#f8fafc' }} />
              </div>

              {/* Tasks */}
              {row.tasks.map(t => (
                <div key={t.id} style={{ display:'flex', borderBottom:'1px solid #f1f5f9', alignItems:'center' }}>
                  <div style={{ width:230, flexShrink:0, padding:'9px 16px 9px 30px', position:'sticky', left:0, background:'#fff', zIndex:1, borderRight:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:7 }}>
                    <span style={{ fontSize:12.5, color:'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</span>
                    {!t.hasDates && (
                      <span style={{ marginLeft:'auto', flexShrink:0, display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, color:'#b45309', background:'#fef3c7', padding:'1px 7px', borderRadius:5, whiteSpace:'nowrap' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                        Sin fechas
                      </span>
                    )}
                  </div>
                  <div style={{ position:'relative', height:38, flexShrink:0, width:gantt.trackW }}>
                    {t.hasDates && t.barStyle && (
                      <div
                        className="g-bar"
                        data-tid={t.id}
                        onClick={() => openTask(t.id)}
                        title={t.barTitle}
                        style={t.barStyle}
                      >
                        <span style={{ fontSize:11, fontWeight:600, color:'#fff', whiteSpace:'nowrap', textShadow:'0 1px 1px rgba(0,0,0,.18)' }}>{t.barName}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:18, marginTop:14, flexWrap:'wrap' }}>
        {gantt.legend.map((l, i) => (
          <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12, color:'#475569' }}>
            <span style={{ width:14, height:10, borderRadius:3, background:l.color, flexShrink:0 }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Builders ────────────────────────────────────────────────────────────────
interface GanttColumn { top: string; sub: string; style: React.CSSProperties }
interface GanttTask   { id: string; name: string; hasDates: boolean; barStyle?: React.CSSProperties; barName: string; barTitle: string }
interface GanttRow    { id: string; name: string; color: string; tasks: GanttTask[] }
interface GanttData   {
  columns: GanttColumn[]
  rows: GanttRow[]
  trackW: number
  todayStyle: React.CSSProperties
  showToday: boolean
  rangeLabel: string
  legend: { label: string; color: string }[]
}

function buildGantt(
  zoom: GanttZoom, offset: number,
  modules: { id: string; name: string; color: string }[],
  tasks: PlannerTask[],
  members: { id: string; name: string; hoursPerDay: number; color: string }[],
  colorBy: ColorBy,
): GanttData {
  const dayW      = zoom === 'days' ? 42 : 20
  const daysTotal = zoom === 'days' ? 21 : 56

  const today  = new Date(); today.setHours(12,0,0,0)
  const back   = (today.getDay() + 6) % 7
  const start  = new Date(today); start.setDate(start.getDate() - back + offset)
  const startISO = toISO(start)
  const trackW = daysTotal * dayW

  const columns: GanttColumn[] = []
  if (zoom === 'days') {
    for (let i = 0; i < daysTotal; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i)
      const we = isWeekend(d)
      columns.push({
        top: String(d.getDate()),
        sub: DAY_NAMES[d.getDay()],
        style: { flexShrink:0, textAlign:'center', padding:'8px 0', fontSize:11, borderRight:'1px solid #eef2f6', width:dayW, background: we ? '#f8fafc' : '#fff' },
      })
    }
  } else {
    for (let w = 0; w < 8; w++) {
      const d = new Date(start); d.setDate(d.getDate() + w*7)
      columns.push({
        top: fmtShort(d),
        sub: `sem ${w+1}`,
        style: { flexShrink:0, textAlign:'center', padding:'8px 0', fontSize:11, borderRight:'1px solid #eef2f6', width:dayW*7, background:'#fff' },
      })
    }
  }

  const todayISO_ = todayISO()
  const todayLeft = dayDiff(startISO, todayISO_) * dayW
  const showToday = todayLeft >= 0 && todayLeft <= trackW
  const todayStyle: React.CSSProperties = { position:'absolute', top:0, bottom:0, width:2, background:'#ef4444', zIndex:2, pointerEvents:'none', left: 230 + todayLeft }

  const endDate = new Date(start.getTime() + (daysTotal-1)*86400000)

  const rows: GanttRow[] = modules.map(m => {
    const mt = tasks.filter(t => t.moduleId === m.id)
    return {
      id: m.id, name: m.name, color: m.color,
      tasks: mt.map(t => {
        const endISO = computeEndISO(t, members)
        const has    = !!t.startDate && !!endISO
        if (!has) return { id:t.id, name:t.name, hasDates:false, barName:'', barTitle:t.name }
        const left  = dayDiff(startISO, t.startDate!) * dayW
        const span  = (dayDiff(t.startDate!, endISO!) + 1)
        const w     = Math.max(dayW * 0.7, span*dayW - 4)
        const sKey  = ((t.status || 'todo') in STATUS_META ? t.status : 'todo') as keyof typeof STATUS_META
        const color = colorBy === 'status' ? STATUS_META[sKey].dot : m.color
        return {
          id: t.id, name: t.name, hasDates: true,
          barStyle: {
            position:'absolute', top:'50%', transform:'translateY(-50%)',
            height:22, borderRadius:6, cursor:'pointer',
            display:'flex', alignItems:'center', padding:'0 9px', overflow:'hidden',
            transition:'filter .12s', boxShadow:'0 1px 2px rgba(15,23,42,.12)',
            left: left+2, width: w, background: color,
          } as React.CSSProperties,
          barName: t.name,
          barTitle: `${t.name} · ${fmtShort(parseISO(t.startDate!))} → ${fmtShort(parseISO(endISO!))}`,
        }
      }),
    }
  })

  const legend = colorBy === 'status'
    ? Object.entries(STATUS_META).map(([, v]) => ({ label: v.label, color: v.dot }))
    : modules.map(m => ({ label: m.name, color: m.color }))

  return { columns, rows, trackW, todayStyle, showToday, legend, rangeLabel: `${fmtShort(start)} – ${fmtShort(endDate)}` }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const btnStyle: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer' }

function MiniBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ background: active?'#fff':'transparent', color: active?'#0f172a':'#64748b', border:'none', borderRadius:6, padding:'5px 11px', fontSize:12, fontWeight:600, cursor:'pointer', boxShadow: active?'0 1px 2px rgba(15,23,42,.1)':'none' }}>
      {children}
    </button>
  )
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ background: active?'#0f172a':'#fff', color: active?'#fff':'#475569', border:'1px solid '+(active?'#0f172a':'#e2e8f0'), borderRadius:6, padding:'4px 9px', fontSize:11.5, fontWeight:600, cursor:'pointer' }}>
      {children}
    </button>
  )
}

if (typeof document !== 'undefined' && !document.getElementById('planner-gantt-css')) {
  const style = document.createElement('style')
  style.id = 'planner-gantt-css'
  style.textContent = `.g-bar:hover { filter:brightness(1.06); }`
  document.head.appendChild(style)
}
