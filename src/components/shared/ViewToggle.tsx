import { useTaskStore } from '../../store/useTaskStore'
import { ViewMode } from '../../types'

const OPTIONS: { value: ViewMode; label: string; icon: string }[] = [
  { value: 'gantt',  label: 'Gantt',  icon: '📊' },
  { value: 'kanban', label: 'Kanban', icon: '🗂' },
]

export default function ViewToggle() {
  const view    = useTaskStore(s => s.view)
  const setView = useTaskStore(s => s.setView)

  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
      {OPTIONS.map(o => (
        <button
          key={o.value}
          onClick={() => setView(o.value)}
          className={`px-4 py-1.5 text-sm font-semibold transition-colors
            ${view === o.value
              ? 'bg-[#1A5276] text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
        >
          {o.icon} {o.label}
        </button>
      ))}
    </div>
  )
}
