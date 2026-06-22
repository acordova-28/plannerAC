import { User, Flag, Download, LogOut } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { ComputedTask, ZoomLevel } from '@wuolla/shared'
import { exportCSV } from '../../utils/csvExport'
import { formatDate, formatDateISO } from '../../utils/dateUtils'

interface Props { computed: ComputedTask[] }

const ZOOM_OPTIONS: { value: ZoomLevel; label: string }[] = [
  { value: 'mes',    label: 'Mes' },
  { value: 'semana', label: 'Semana' },
  { value: 'dia',    label: 'Día' },
]

export default function Header({ computed }: Props) {
  const config         = useTaskStore(s => s.config)
  const zoomLevel      = useTaskStore(s => s.zoomLevel)
  const view           = useTaskStore(s => s.view)
  const user           = useAuthStore(s => s.user)
  const logout         = useAuthStore(s => s.logout)
  const updateConfig   = useTaskStore(s => s.updateConfig)
  const setZoom        = useTaskStore(s => s.setZoom)
  const freezeBaseline = useTaskStore(s => s.freezeBaseline)

  const totalHoras    = computed.reduce((acc, t) => acc + (t.horas ?? 0), 0)
  const sinEstimar    = computed.filter(t => !t.horas).length
  const completadas   = computed.filter(t => t.estado === 'Completado').length
  const pctCompletado = computed.length ? Math.round((completadas / computed.length) * 100) : 0
  const lastEnd       = computed
    .filter(t => t.fechaFin)
    .map(t => t.fechaFin!)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null

  return (
    <header className="bg-[#1A5276] text-white px-4 py-3 flex items-center gap-6 flex-wrap shrink-0">
      {/* Title */}
      <div className="mr-2">
        <div className="text-base font-bold tracking-wide">Control de Estimación — WUOLLA</div>
        <div className="text-xs opacity-70 mt-0.5">Lunes a Viernes · Horas acumuladas por día</div>
      </div>

      {/* Metrics */}
      <div className="flex gap-5 flex-wrap">
        <Metric label="Total tareas"    value={String(computed.length)} />
        <Metric label="Sin estimar"     value={String(sinEstimar)} warn={sinEstimar > 0} />
        <Metric label="Horas estimadas" value={`${totalHoras}h`} />
        <Metric label="% completado"    value={`${pctCompletado}%`} />
        <Metric
          label="Fecha fin est."
          value={lastEnd ? formatDate(lastEnd) : '—'}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 ml-auto flex-wrap">
        {/* Date */}
        <label className="flex items-center gap-2 text-xs font-semibold opacity-90">
          Inicio
          <input
            type="date"
            value={formatDateISO(config.fechaInicio)}
            onChange={e => {
              const [y, m, d] = e.target.value.split('-').map(Number)
              updateConfig({ fechaInicio: new Date(y, m - 1, d) })
            }}
            className="bg-white/10 border border-white/30 rounded px-2 py-1 text-white text-xs font-semibold focus:outline-none focus:border-white/60"
          />
        </label>

        {/* HPD */}
        <label className="flex items-center gap-2 text-xs font-semibold opacity-90">
          h/día
          <input
            type="number"
            min={1} max={24}
            value={config.horasPorDia}
            onChange={e => updateConfig({ horasPorDia: Number(e.target.value) || 8 })}
            className="w-14 bg-white/10 border border-white/30 rounded px-2 py-1 text-white text-xs font-bold text-center focus:outline-none focus:border-white/60"
          />
        </label>

        {/* Zoom (only in Gantt) */}
        {view === 'gantt' && (
          <div className="flex rounded overflow-hidden border border-white/30">
            {ZOOM_OPTIONS.map(z => (
              <button
                key={z.value}
                onClick={() => setZoom(z.value)}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors
                  ${zoomLevel === z.value ? 'bg-white text-[#1A5276]' : 'text-white hover:bg-white/10'}`}
              >
                {z.label}
              </button>
            ))}
          </div>
        )}

        {/* Baseline */}
        <button
          onClick={freezeBaseline}
          title={config.baselineDate ? `Baseline: ${formatDate(config.baselineDate)}` : 'Fijar baseline'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border border-white/30 hover:bg-white/10 transition-colors"
        >
          <Flag size={12} className={config.baselineDate ? 'fill-white' : ''} />
          {config.baselineDate ? 'Baseline fijado' : 'Fijar baseline'}
        </button>

        {/* Export */}
        <button
          onClick={() => exportCSV(computed, config)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-green-600 hover:bg-green-500 transition-colors"
        >
          <Download size={12} />
          Exportar CSV
        </button>

        {/* Separador + usuario + logout */}
        <div className="w-px h-5 bg-white/20 mx-1" />
        {user && (
          <span className="flex items-center gap-1.5 text-xs opacity-75 font-medium whitespace-nowrap">
            <User size={12} />
            {user.nombre}
          </span>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border border-white/30 hover:bg-white/10 transition-colors"
        >
          <LogOut size={12} />
          Salir
        </button>
      </div>
    </header>
  )
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider opacity-60">{label}</span>
      <span className={`text-sm font-bold ${warn ? 'text-yellow-300' : ''}`}>{value}</span>
    </div>
  )
}
