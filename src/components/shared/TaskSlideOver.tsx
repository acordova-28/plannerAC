import { useState, useEffect } from 'react'
import { ComputedTask, Estado, Prioridad, Tipo } from '../../types'
import { useTaskStore } from '../../store/useTaskStore'
import Badge from './PriorityBadge'
import { formatDate } from '../../utils/dateUtils'

interface Props { task: ComputedTask }

export default function TaskSlideOver({ task }: Props) {
  const updateTask   = useTaskStore(s => s.updateTask)
  const setActiveTask = useTaskStore(s => s.setActiveTask)

  const [horas,    setHoras]    = useState(task.horas   ?? '')
  const [baseline, setBaseline] = useState(task.horasBaseline ?? '')
  const [pct,      setPct]      = useState(task.porcentajeReal)
  const [estado,   setEstado]   = useState(task.estado)
  const [prioridad,setPrioridad]= useState(task.prioridad)
  const [tipo,     setTipo]     = useState(task.tipo)
  const [resp,     setResp]     = useState(task.responsable)

  useEffect(() => {
    setHoras(task.horas ?? '')
    setBaseline(task.horasBaseline ?? '')
    setPct(task.porcentajeReal)
    setEstado(task.estado)
    setPrioridad(task.prioridad)
    setTipo(task.tipo)
    setResp(task.responsable)
  }, [task.id])  // eslint-disable-line react-hooks/exhaustive-deps

  function save() {
    updateTask(task.id, {
      horas:          horas === '' ? null : Number(horas),
      horasBaseline:  baseline === '' ? null : Number(baseline),
      porcentajeReal: pct,
      estado,
      prioridad,
      tipo,
      responsable: resp,
    })
    setActiveTask(null)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={() => setActiveTask(null)}
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1A5276] text-white px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold opacity-70 mb-1">{task.id} · {task.modulo}</div>
            <div className="text-sm font-semibold leading-snug">{task.tarea}</div>
          </div>
          <button onClick={() => setActiveTask(null)} className="text-white/70 hover:text-white text-xl leading-none shrink-0">✕</button>
        </div>

        {/* Dates (read-only) */}
        {task.fechaInicio && (
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex gap-6 text-xs">
            <div><span className="opacity-60">Inicio:</span> <strong>{formatDate(task.fechaInicio)}</strong></div>
            <div><span className="opacity-60">Fin:</span> <strong>{task.fechaFin ? formatDate(task.fechaFin) : '—'}</strong></div>
            {task.duracionDias && <div><span className="opacity-60">Días:</span> <strong>{task.duracionDias}</strong></div>}
          </div>
        )}

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <Row label="Horas estimadas">
            <input
              type="number" min={0} step={0.5}
              value={horas}
              onChange={e => setHoras(e.target.value)}
              placeholder="Sin estimar"
              className={fieldCls}
            />
          </Row>

          <Row label="Horas baseline">
            <input
              type="number" min={0} step={0.5}
              value={baseline}
              onChange={e => setBaseline(e.target.value)}
              placeholder="No fijado"
              className={fieldCls}
            />
          </Row>

          <Row label={`% Progreso real: ${pct}%`}>
            <input
              type="range" min={0} max={100} step={5}
              value={pct}
              onChange={e => setPct(Number(e.target.value))}
              className="w-full accent-[#1A5276]"
            />
          </Row>

          <Row label="Estado">
            <select value={estado} onChange={e => setEstado(e.target.value as Estado)} className={fieldCls}>
              {Object.values(Estado).map(v => <option key={v}>{v}</option>)}
            </select>
          </Row>

          <Row label="Prioridad">
            <div className="flex gap-2 flex-wrap">
              {Object.values(Prioridad).map(v => (
                <button key={v}
                  onClick={() => setPrioridad(v)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all
                    ${prioridad === v ? 'border-[#1A5276] ring-2 ring-[#1A5276]/30' : 'border-slate-200'}`}
                >
                  <Badge type="prioridad" value={v} />
                </button>
              ))}
            </div>
          </Row>

          <Row label="Tipo">
            <div className="flex gap-2 flex-wrap">
              {[Tipo.Frontend, Tipo.Backend, Tipo.FrontBack, Tipo.SinTipo].map(v => (
                <button key={v}
                  onClick={() => setTipo(v)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all
                    ${tipo === v ? 'border-[#1A5276] ring-2 ring-[#1A5276]/30' : 'border-slate-200'}`}
                >
                  {v || '(ninguno)'}
                </button>
              ))}
            </div>
          </Row>

          <Row label="Responsable">
            <input
              type="text"
              value={resp}
              onChange={e => setResp(e.target.value)}
              placeholder="Nombre"
              className={fieldCls}
            />
          </Row>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 flex gap-3">
          <button onClick={save}
            className="flex-1 bg-[#1A5276] hover:bg-[#154360] text-white rounded-lg py-2.5 text-sm font-bold transition-colors">
            Guardar cambios
          </button>
          <button onClick={() => setActiveTask(null)}
            className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
        </div>
      </aside>
    </>
  )
}

const fieldCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A5276]'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
}
