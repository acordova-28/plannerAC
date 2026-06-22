import { ComputedTask, Prioridad, Tipo } from '@wuolla/shared'
import { useTaskStore } from '../../store/useTaskStore'

interface Props { tasks: ComputedTask[] }

export default function Filters({ tasks }: Props) {
  const filters     = useTaskStore(s => s.filters)
  const setFilters  = useTaskStore(s => s.setFilters)
  const clearFilters = useTaskStore(s => s.clearFilters)

  const responsables = [...new Set(tasks.map(t => t.responsable).filter(Boolean))].sort()
  const modulos      = [...new Set(tasks.map(t => t.modulo))].sort()
  const activeCount  = [
    filters.responsable.length,
    filters.modulo.length,
    filters.prioridad.length,
    filters.tipo.length,
  ].reduce((a, b) => a + b, 0)

  function toggle<T extends string>(current: T[], value: T): T[] {
    return current.includes(value) ? current.filter(x => x !== value) : [...current, value]
  }

  return (
    <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
      {/* Responsable */}
      {responsables.length > 1 && (
        <MultiSelect
          label="Responsable"
          options={responsables}
          selected={filters.responsable}
          onChange={v => setFilters({ responsable: toggle(filters.responsable, v) })}
        />
      )}

      {/* Módulo */}
      {modulos.length > 1 && (
        <MultiSelect
          label="Módulo"
          options={modulos}
          selected={filters.modulo}
          onChange={v => setFilters({ modulo: toggle(filters.modulo, v) })}
        />
      )}

      {/* Prioridad */}
      <MultiSelect
        label="Prioridad"
        options={[Prioridad.Alta, Prioridad.Media, Prioridad.Baja]}
        selected={filters.prioridad}
        onChange={v => setFilters({ prioridad: toggle(filters.prioridad, v as Prioridad) })}
      />

      {/* Tipo */}
      <MultiSelect
        label="Tipo"
        options={[Tipo.Frontend, Tipo.Backend, Tipo.FrontBack]}
        selected={filters.tipo}
        onChange={v => setFilters({ tipo: toggle(filters.tipo, v as Tipo) })}
      />

      {activeCount > 0 && (
        <button
          onClick={clearFilters}
          className="text-xs text-red-600 font-semibold hover:text-red-800 transition-colors"
        >
          ✕ Limpiar ({activeCount})
        </button>
      )}
    </div>
  )
}

function MultiSelect({
  label, options, selected, onChange,
}: {
  label:    string
  options:  string[]
  selected: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="relative group">
      <button className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded border transition-colors
        ${selected.length
          ? 'border-[#1A5276] text-[#1A5276] bg-blue-50'
          : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'}`}
      >
        {label}
        {selected.length > 0 && (
          <span className="bg-[#1A5276] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
            {selected.length}
          </span>
        )}
        <span className="opacity-50">▾</span>
      </button>

      <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 min-w-[140px] hidden group-focus-within:block group-hover:block">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2
              ${selected.includes(opt) ? 'text-[#1A5276] font-semibold' : 'text-slate-700'}`}
          >
            <span className={`w-3.5 h-3.5 border rounded flex items-center justify-center shrink-0
              ${selected.includes(opt) ? 'border-[#1A5276] bg-[#1A5276]' : 'border-slate-300'}`}
            >
              {selected.includes(opt) && <span className="text-white text-[9px]">✓</span>}
            </span>
            {opt || '(sin tipo)'}
          </button>
        ))}
      </div>
    </div>
  )
}
