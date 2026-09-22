import {
  usePlannerStore, PlannerTask, Member, ColType, STATUS_META, PRIORITY_META,
  initials, computeEndISO, fmtShort, parseISO,
} from '../../store/usePlannerStore'

export default function PlannerTableView() {
  const activeTeamId   = usePlannerStore(s => s.activeTeamId)
  const allModules     = usePlannerStore(s => s.modules)
  const allTasks       = usePlannerStore(s => s.tasks)
  const teamModules    = allModules.filter(m => m.teamId === activeTeamId)
  const teamTasks      = allTasks.filter(t => t.teamId === activeTeamId)
  const members        = usePlannerStore(s => s.members)
  const collapsed      = usePlannerStore(s => s.collapsed)
  const customColumns  = usePlannerStore(s => s.customColumns)
  const toggleModule   = usePlannerStore(s => s.toggleModule)
  const openTask       = usePlannerStore(s => s.openTask)
  const deleteTaskById = usePlannerStore(s => s.deleteTaskById)
  const updateCustomCell = usePlannerStore(s => s.updateCustomCell)
  const saveCustomCell   = usePlannerStore(s => s.saveCustomCell)
  const deleteColumn     = usePlannerStore(s => s.deleteColumn)
  const startAddColumn   = usePlannerStore(s => s.startAddColumn)
  const requestConfirm   = usePlannerStore(s => s.requestConfirm)

  const num = 0

  return (
    <div style={{ padding:'22px 24px' }}>
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(15,23,42,.04)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
              <Th style={{ width:44, textAlign:'center' }}>#</Th>
              <Th style={{ minWidth:220, textAlign:'left' }}>Nombre de tarea</Th>
              <Th>Asignado a</Th>
              <Th>Inicio</Th>
              <Th>Fin</Th>
              <Th style={{ textAlign:'center' }}>Hrs</Th>
              <Th>Estado</Th>
              <Th>Prioridad</Th>
              {customColumns.map(c => (
                <Th key={c.id}>
                  <ColumnHeader
                    name={c.name}
                    onDelete={() => requestConfirm({
                      title: '¿Eliminar columna?',
                      message: `Se eliminará la columna "${c.name}" y sus valores en todas las tareas.`,
                      onConfirm: () => deleteColumn(c.id),
                    })}
                  />
                </Th>
              ))}
              <Th style={{ textAlign:'right' }}>
                <button
                  onClick={startAddColumn}
                  style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#fff', border:'1px dashed #cbd5e1', borderRadius:7, padding:'5px 9px', fontSize:11.5, fontWeight:600, color:'#475569', cursor:'pointer', whiteSpace:'nowrap' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Columna
                </button>
              </Th>
            </tr>
          </thead>
          <tbody>
            {teamModules.map(mod => {
              const modTasks = teamTasks.filter(t => t.moduleId === mod.id)
              const open = !collapsed[mod.id]
              return (
                <ModuleGroup
                  key={mod.id}
                  mod={mod}
                  tasks={modTasks}
                  open={open}
                  members={members}
                  customColumns={customColumns}
                  numStart={num}
                  onToggle={() => toggleModule(mod.id)}
                  onOpenTask={openTask}
                  onDelete={deleteTaskById}
                  onCustomChange={updateCustomCell}
                  onCustomSave={saveCustomCell}
                  numRef={{ current: num }}
                  requestConfirm={requestConfirm}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ColumnHeader({ name, onDelete }: { name: string; onDelete: () => void }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
      {name}
      <button
        onClick={onDelete}
        title="Eliminar columna"
        style={{ display:'inline-flex', padding:2, background:'none', border:'none', borderRadius:4, cursor:'pointer', color:'#94a3b8', lineHeight:1 }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </span>
  )
}

function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th style={{ padding:'11px 12px', fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em', textAlign:'left', whiteSpace:'nowrap', ...style }}>
      {children}
    </th>
  )
}

interface GroupProps {
  mod: { id: string; name: string; color: string }
  tasks: PlannerTask[]
  open: boolean
  members: Member[]
  customColumns: { id: string; name: string; type: ColType }[]
  numStart: number
  numRef: { current: number }
  onToggle: () => void
  onOpenTask: (id: string) => void
  onDelete: (id: string) => void
  onCustomChange: (tid: string, col: string, val: string) => void
  onCustomSave:   (tid: string, col: string, val: string) => void
  requestConfirm: (req: { title: string; message: string; confirmLabel?: string; onConfirm: () => void }) => void
}

function ModuleGroup({ mod, tasks, open, members, customColumns, onToggle, onOpenTask, onDelete, onCustomChange, onCustomSave, requestConfirm }: GroupProps) {
  return (
    <>
      <tr
        style={{ background:'#f8fafc', borderTop:'1px solid #e2e8f0', cursor:'pointer' }}
        onClick={onToggle}
      >
        <td style={{ textAlign:'center', padding:'9px 8px' }}>
          <span style={{ display:'inline-flex', transition:'transform .15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </span>
        </td>
        <td colSpan={20} style={{ padding:'9px 14px' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:9 }}>
            <span style={{ width:9, height:9, borderRadius:3, background:mod.color, flexShrink:0 }} />
            <span style={{ fontWeight:700, color:'#0f172a', fontSize:13 }}>{mod.name}</span>
            <span style={{ fontSize:11, color:'#64748b', background:'#e2e8f0', padding:'1px 8px', borderRadius:20, fontWeight:600 }}>{tasks.length}</span>
          </span>
        </td>
      </tr>
      {open && tasks.map((t, i) => (
        <TaskRow
          key={t.id}
          task={t}
          num={i + 1}
          mod={mod}
          members={members}
          customColumns={customColumns}
          onOpen={() => onOpenTask(t.id)}
          onDelete={() => onDelete(t.id)}
          onCustomChange={onCustomChange}
          onCustomSave={onCustomSave}
          requestConfirm={requestConfirm}
        />
      ))}
    </>
  )
}

interface RowProps {
  task: PlannerTask
  num: number
  mod: { color: string }
  members: Member[]
  customColumns: { id: string; type: ColType }[]
  onOpen: () => void
  onDelete: () => void
  onCustomChange: (tid: string, col: string, val: string) => void
  onCustomSave:   (tid: string, col: string, val: string) => void
  requestConfirm: (req: { title: string; message: string; confirmLabel?: string; onConfirm: () => void }) => void
}

function TaskRow({ task, num, members, customColumns, onOpen, onDelete, onCustomChange, onCustomSave, requestConfirm }: RowProps) {
  const assignee  = members.find(m => m.id === task.assigneeId)
  const endISO    = computeEndISO(task, members)
  const st        = STATUS_META[task.status]
  const pr        = PRIORITY_META[task.priority]

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    requestConfirm({
      title: '¿Eliminar tarea?',
      message: `Se eliminará "${task.name || 'esta tarea'}" permanentemente. Esta acción no se puede deshacer.`,
      onConfirm: onDelete,
    })
  }

  return (
    <tr
      className="task-row"
      style={{ borderTop:'1px solid #f1f5f9', cursor:'pointer' }}
      onClick={onOpen}
    >
      <td style={{ textAlign:'center', padding:'11px 8px', color:'#94a3b8', fontSize:12 }}>{num}</td>
      <td style={{ padding:'11px 14px', position:'relative' }}>
        <span style={{ fontWeight:500, color:'#1e293b' }}>{task.name}</span>
        <span className="row-actions" style={{ opacity:0, transition:'opacity .12s', position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', display:'flex', gap:4 }}>
          <button
            onClick={handleDelete}
            title="Eliminar"
            style={{ display:'flex', padding:5, background:'#fff', border:'1px solid #e2e8f0', borderRadius:6, cursor:'pointer' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </span>
      </td>
      <td style={{ padding:'11px 12px' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
          <span style={{ width:24, height:24, borderRadius:'50%', background:assignee?.color||'#cbd5e1', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {assignee ? initials(assignee.name) : '?'}
          </span>
          <span style={{ color:'#334155' }}>{assignee?.name || 'Sin asignar'}</span>
        </span>
      </td>
      <td style={{ padding:'11px 12px', color:'#475569', whiteSpace:'nowrap' }}>
        {task.startDate ? fmtShort(parseISO(task.startDate)) : '—'}
      </td>
      <td style={{ padding:'11px 12px', color:'#475569', whiteSpace:'nowrap' }}>
        {endISO ? fmtShort(parseISO(endISO)) : '—'}
      </td>
      <td style={{ padding:'11px 12px', textAlign:'center', color:'#475569' }}>
        {task.durationHrs || '—'}
      </td>
      <td style={{ padding:'11px 12px' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 9px', borderRadius:20, fontSize:11.5, fontWeight:600, background:st.bg, color:st.fg, whiteSpace:'nowrap' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:st.dot }} />
          {st.label}
        </span>
      </td>
      <td style={{ padding:'11px 12px' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:7, color:'#475569', fontSize:12.5 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:pr.color }} />
          {pr.label}
        </span>
      </td>
      {customColumns.map(c => (
        <td key={c.id} style={{ padding:'7px 10px' }}>
          <CustomCell
            type={c.type}
            value={(task.custom||{})[c.id]||''}
            onChange={val => onCustomChange(task.id, c.id, val)}
            onSave={val => onCustomSave(task.id, c.id, val)}
          />
        </td>
      ))}
      <td />
    </tr>
  )
}

const customCellInputStyle: React.CSSProperties = {
  width:'100%', minWidth:80, border:'1px solid #e2e8f0', borderRadius:6,
  padding:'5px 8px', fontSize:12.5, color:'#334155', background:'#fff',
}

function CustomCell({ type, value, onChange, onSave }: {
  type: ColType
  value: string
  onChange: (val: string) => void
  onSave: (val: string) => void
}) {
  if (type === 'checkbox') {
    const checked = value === 'true'
    return (
      <input
        type="checkbox"
        checked={checked}
        onChange={e => { const v = e.target.checked ? 'true' : 'false'; onChange(v); onSave(v) }}
        onClick={e => e.stopPropagation()}
        style={{ width:16, height:16, cursor:'pointer' }}
      />
    )
  }

  if (type === 'date') {
    return (
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={e => onSave(e.target.value)}
        onClick={e => e.stopPropagation()}
        style={customCellInputStyle}
      />
    )
  }

  if (type === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={e => onSave(e.target.value)}
        onClick={e => e.stopPropagation()}
        placeholder="—"
        style={customCellInputStyle}
      />
    )
  }

  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={e => onSave(e.target.value)}
      onClick={e => e.stopPropagation()}
      placeholder="—"
      style={customCellInputStyle}
    />
  )
}

// Inject hover CSS once
if (typeof document !== 'undefined' && !document.getElementById('planner-table-css')) {
  const style = document.createElement('style')
  style.id = 'planner-table-css'
  style.textContent = `.task-row:hover { background:#f8fafc; } .task-row:hover .row-actions { opacity:1 !important; }`
  document.head.appendChild(style)
}
