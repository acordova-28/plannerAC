import { GanttLayout } from '../../hooks/useGanttLayout'
import { ZoomLevel } from '../../types'
import { MESES, MESES_CORTO, DIAS_SEMANA } from '../../utils/dateUtils'
import { addDays } from '../../utils/dateUtils'
import { isWeekend } from '../../utils/workingDays'
import { TIMELINE_HEIGHT } from '../../constants/gantt'

interface Cell { x: number; width: number; label: string; sub?: string; dim?: boolean }

function monthCells(chartStart: Date, totalDays: number, dw: number): Cell[] {
  const cells: Cell[] = []
  let i = 0
  while (i < totalDays) {
    const d = addDays(chartStart, i)
    const m = d.getMonth(); const y = d.getFullYear()
    let count = 0
    while (i + count < totalDays) {
      const next = addDays(chartStart, i + count)
      if (next.getMonth() !== m || next.getFullYear() !== y) break
      count++
    }
    cells.push({ x: i * dw, width: count * dw, label: `${MESES[m]} ${y}` })
    i += count
  }
  return cells
}

function weekCells(chartStart: Date, totalDays: number, dw: number): Cell[] {
  const cells: Cell[] = []
  for (let i = 0; i < totalDays; i += 7) {
    const count = Math.min(7, totalDays - i)
    const d = addDays(chartStart, i)
    cells.push({ x: i * dw, width: count * dw, label: `${d.getDate()} ${MESES_CORTO[d.getMonth()]}` })
  }
  return cells
}

function dayCells(chartStart: Date, totalDays: number, dw: number): Cell[] {
  return Array.from({ length: totalDays }, (_, i) => {
    const d = addDays(chartStart, i)
    return {
      x:     i * dw,
      width: dw,
      label: String(d.getDate()),
      sub:   DIAS_SEMANA[d.getDay()],
      dim:   isWeekend(d),
    }
  })
}

interface Props {
  layout:    GanttLayout
  zoomLevel: ZoomLevel
}

export default function GanttTimeline({ layout, zoomLevel }: Props) {
  const { chartStart, totalDays, dayWidth: dw, chartWidth } = layout

  const topCells: Cell[]    = zoomLevel === 'dia' ? weekCells(chartStart, totalDays, dw)  : monthCells(chartStart, totalDays, dw)
  const bottomCells: Cell[] = zoomLevel === 'dia' ? dayCells(chartStart, totalDays, dw)   : weekCells(chartStart, totalDays, dw)

  const ROW_H = TIMELINE_HEIGHT / 2

  return (
    <div
      style={{ width: chartWidth, height: TIMELINE_HEIGHT, position: 'relative' }}
      className="bg-slate-50 border-b-2 border-[#1A5276]/20 select-none"
    >
      {/* Top row */}
      {topCells.map((cell, i) => (
        <div
          key={i}
          style={{ position: 'absolute', left: cell.x, width: cell.width, height: ROW_H, top: 0 }}
          className="border-r border-slate-200 flex items-center px-2 overflow-hidden"
        >
          <span className="text-[11px] font-bold text-slate-600 truncate">{cell.label}</span>
        </div>
      ))}

      {/* Bottom row */}
      {bottomCells.map((cell, i) => (
        <div
          key={i}
          style={{ position: 'absolute', left: cell.x, width: cell.width, height: ROW_H, top: ROW_H }}
          className={`border-r border-slate-200 flex flex-col items-center justify-center overflow-hidden
            ${cell.dim ? 'bg-slate-100 text-slate-400' : 'text-slate-500'}`}
        >
          <span className="text-[10px] font-semibold leading-tight truncate">{cell.label}</span>
          {cell.sub && <span className="text-[9px] leading-tight opacity-70">{cell.sub}</span>}
        </div>
      ))}
    </div>
  )
}
