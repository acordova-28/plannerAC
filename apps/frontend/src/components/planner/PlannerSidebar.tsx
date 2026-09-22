import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePlannerStore, initials } from '../../store/usePlannerStore'
import { useAuthStore } from '../../store/useAuthStore'

type NavItem = { key: string; label: string; icon: React.ReactNode; badge?: string }

const NAV_ITEMS: NavItem[] = [
  {
    key: 'tareas', label: 'Tareas',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="m17 18 3-3-3-3"/><path d="M20 6h-2"/></svg>,
  },
  {
    key: 'modulos', label: 'Módulos',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>,
  },
  {
    key: 'miembros', label: 'Miembros',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    key: 'equipos', label: 'Mis Equipos', badge: 'ADMIN',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    key: 'stats', label: 'Estadísticas',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
  },
  {
    key: 'config', label: 'Configuración',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/></svg>,
  },
]

const TASK_SECTIONS = ['tareas', 'kanban', 'gantt']

export default function PlannerSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [hoverLogo, setHoverLogo] = useState(false)
  const navigate     = useNavigate()
  const { pathname } = useLocation()

  const parts   = pathname.split('/').filter(Boolean)
  const section = parts.length >= 2 ? parts[1] : parts[0] || 'tareas'

  const teams        = usePlannerStore(s => s.teams)
  const activeTeamId = usePlannerStore(s => s.activeTeamId)
  const members      = usePlannerStore(s => s.members)
  const activeTeam   = teams.find(t => t.id === activeTeamId) || teams[0]
  const teamMembers  = members.filter(m => (activeTeam?.memberIds ?? []).includes(m.id))
  const user         = useAuthStore(s => s.user)
  const logout       = useAuthStore(s => s.logout)

  const handleCycleTeam = () => {
    const i    = teams.findIndex(t => t.id === activeTeam.id)
    const next = teams[(i + 1) % teams.length]
    if (next) navigate(`/${next.id}/${section}`)
  }

  const ini = initials(activeTeam.name)

  const W = collapsed ? 56 : 248

  const labelStyle: React.CSSProperties = {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    maxWidth: collapsed ? 0 : 160,
    opacity: collapsed ? 0 : 1,
    transition: 'max-width 0.22s ease, opacity 0.15s ease',
  }

  return (
    <aside style={{
      width: W, flexShrink: 0,
      background: '#0f172a', color: '#cbd5e1',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.22s ease',
      overflow: 'hidden',
    }}>

      {/* Brand */}
      <div style={{ padding: '20px 12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          onMouseEnter={() => setHoverLogo(true)}
          onMouseLeave={() => setHoverLogo(false)}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          style={{
            width: 30, height: 30, borderRadius: 7,
            background: hoverLogo ? '#2d3a8c' : 'linear-gradient(135deg,#4c6ef5,#3b5bdb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, border: 'none', cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          {hoverLogo
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${collapsed ? 180 : 0}deg)`, transition: 'transform 0.22s ease' }}><path d="m15 18-6-6 6-6"/></svg>
            : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/></svg>
          }
        </button>
        <span style={{ ...labelStyle, fontWeight: 700, fontSize: 15, color: '#f8fafc', letterSpacing: '-.01em' }}>Planner</span>
      </div>

      {/* Team selector */}
      <div style={{ padding: collapsed ? '12px 8px 8px' : '16px 12px 10px', flexShrink: 0, transition: 'padding 0.22s ease' }}>
        {!collapsed && (
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', fontWeight: 600, marginBottom: 8, paddingLeft: 4 }}>
            Equipo activo
          </div>
        )}
        <button
          onClick={handleCycleTeam}
          title={collapsed ? activeTeam.name : undefined}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 10,
            background: '#1e293b', border: '1px solid #334155', borderRadius: 9,
            padding: collapsed ? '7px' : '9px 11px',
            cursor: 'pointer', color: '#f1f5f9', textAlign: 'left',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'padding 0.22s ease',
          }}
        >
          <div style={{ width: 26, height: 26, borderRadius: 6, background: activeTeam.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {ini}
          </div>
          <div style={{ ...labelStyle, flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeTeam.name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{teamMembers.length} miembros</div>
          </div>
          {!collapsed && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>
            </svg>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: collapsed ? '8px 6px' : '8px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto', transition: 'padding 0.22s ease' }}>

        {NAV_ITEMS.map(item => {
          const on = item.key === 'tareas'
            ? TASK_SECTIONS.includes(section)
            : section === item.key
          return (
            <button
              key={item.key}
              onClick={() => navigate(`/${activeTeam.id}/${item.key}`)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 11,
                justifyContent: collapsed ? 'center' : 'flex-start',
                width: '100%',
                background: on ? '#1e293b' : 'transparent',
                color: on ? '#f8fafc' : '#94a3b8',
                border: 'none', borderRadius: 9,
                padding: collapsed ? '9px 6px' : '9px 11px',
                fontSize: 13.5, fontWeight: on ? 600 : 500,
                cursor: 'pointer', textAlign: 'left',
                transition: 'padding 0.22s ease',
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={labelStyle}>{item.label}</span>
              {item.badge && !collapsed && (
                <span style={{ marginLeft: 'auto', fontSize: 9.5, background: '#1e293b', color: '#94a3b8', padding: '2px 6px', borderRadius: 5, fontWeight: 600, letterSpacing: '.04em' }}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: collapsed ? '14px 8px' : '14px 18px',
        borderTop: '1px solid #1e293b',
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        flexShrink: 0,
        transition: 'padding 0.22s ease',
      }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#e2e8f0', flexShrink: 0, overflow: 'hidden' }}>
          {user?.picture
            ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (user ? initials(user.nombre) : 'AD')}
        </div>
        <div style={{ ...labelStyle, minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nombre || 'Admin'}</div>
          <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'admin@wuolla.com'}</div>
        </div>
        {!collapsed && (
          <button
            onClick={logout}
            title="Cerrar sesión"
            style={{ display: 'flex', padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', borderRadius: 6, flexShrink: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        )}
      </div>
    </aside>
  )
}
