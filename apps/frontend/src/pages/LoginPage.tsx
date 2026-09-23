import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { getAuthMethodsApi, type AuthMethods } from '../api/auth.api'

const CSS = `
  .lp-root {
    min-height: 100vh;
    display: flex;
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #fff;
  }

  /* ════════════ LEFT PANEL ════════════ */
  .lp-left {
    width: 52%;
    flex-shrink: 0;
    background: linear-gradient(155deg, #4c6ef5 0%, #3b5bdb 45%, #2f4ab8 100%);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 40px 48px 44px;
  }

  /* subtle radial sheen */
  .lp-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 60% at 30% 20%, rgba(255,255,255,.12), transparent);
    pointer-events: none;
  }

  /* ── Confetti shapes ── */
  .lp-confetti { position: absolute; inset: 0; pointer-events: none; }
  .lp-blob {
    position: absolute;
    border-radius: 50%;
  }

  /* ── Floating UI cards ── */
  .lp-cards {
    position: absolute;
    top: 0; left: 0; right: 0;
    bottom: 140px;
    pointer-events: none;
  }

  .lp-card {
    position: absolute;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,.18), 0 4px 16px rgba(0,0,0,.1);
    overflow: hidden;
    animation: lpCardFloat 5s ease-in-out infinite;
  }
  .lp-card:nth-child(2) { animation-delay: -2.5s; }
  .lp-card:nth-child(3) { animation-delay: -1.2s; }

  @keyframes lpCardFloat {
    0%,100% { transform: var(--tilt) translateY(0); }
    50%      { transform: var(--tilt) translateY(-8px); }
  }

  /* Card 1 — task list */
  .lp-card1 {
    width: 230px;
    top: 12%;
    left: 10%;
    --tilt: rotate(-4deg);
  }
  .lp-card1-header {
    background: #fff9e6;
    padding: 14px 16px 10px;
    border-bottom: 1px solid #f5ead0;
  }
  .lp-card1-tag {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #f59f00;
    margin-bottom: 4px;
  }
  .lp-card1-title {
    font-size: 13px;
    font-weight: 700;
    color: #1a1a2e;
    line-height: 1.3;
  }
  .lp-card1-body { padding: 10px 16px 14px; }
  .lp-card1-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px solid #f8f9fa;
    font-size: 11.5px;
    color: #495057;
  }
  .lp-card1-row:last-child { border-bottom: none; }
  .lp-card1-hrs {
    font-size: 10.5px;
    font-weight: 600;
    color: #868e96;
  }
  .lp-card1-dot {
    width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  }
  .lp-card1-row-inner { display: flex; align-items: center; gap: 7px; }

  /* Card 2 — mini stats */
  .lp-card2 {
    width: 180px;
    top: 38%;
    left: 46%;
    --tilt: rotate(5deg);
  }
  .lp-card2-inner { padding: 14px 16px; }
  .lp-card2-head {
    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  }
  .lp-card2-icon {
    width: 28px; height: 28px; border-radius: 8px;
    background: linear-gradient(135deg, #4c6ef5, #845ef7);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .lp-card2-label { font-size: 11.5px; font-weight: 700; color: #1a1a2e; }
  .lp-card2-sub   { font-size: 10px; color: #868e96; margin-top: 1px; }
  .lp-card2-row {
    display: flex; align-items: center; gap: 7px;
    font-size: 11px; color: #495057; padding: 4px 0;
  }
  .lp-card2-av {
    width: 20px; height: 20px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 8px; font-weight: 700; color: #fff; flex-shrink: 0;
  }

  /* Card 3 — small floating widget */
  .lp-card3 {
    width: 148px;
    top: 62%;
    left: 8%;
    --tilt: rotate(-2deg);
  }
  .lp-card3-inner {
    padding: 12px 14px;
    display: flex; align-items: center; gap: 10px;
  }
  .lp-card3-play {
    width: 32px; height: 32px; border-radius: 50%;
    background: #4c6ef5;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .lp-card3-text { font-size: 11px; font-weight: 700; color: #1a1a2e; line-height: 1.35; }
  .lp-card3-sub  { font-size: 10px; color: #adb5bd; margin-top: 1px; }

  /* Floating mini icon */
  .lp-mini-icon {
    position: absolute;
    top: 30%;
    left: 38%;
    width: 44px; height: 44px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,.14);
    display: flex; align-items: center; justify-content: center;
    animation: lpCardFloat 6s ease-in-out infinite -3s;
    --tilt: rotate(8deg);
  }

  /* ── Left footer ── */
  .lp-left-foot { position: relative; z-index: 1; }
  .lp-left-foot h2 {
    font-size: 24px;
    font-weight: 800;
    color: #fff;
    margin: 0 0 8px;
    line-height: 1.25;
    letter-spacing: -.01em;
  }
  .lp-left-foot p {
    font-size: 13.5px;
    color: rgba(255,255,255,.72);
    margin: 0 0 20px;
    line-height: 1.6;
  }
  .lp-dots { display: flex; gap: 6px; }
  .lp-dot  { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.35); }
  .lp-dot.on { background: #fff; width: 20px; border-radius: 4px; }

  /* ════════════ RIGHT PANEL ════════════ */
  .lp-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 48px;
    background: #fff;
  }

  .lp-form-wrap {
    width: 100%;
    max-width: 360px;
    animation: lpFadeUp .55s cubic-bezier(.16,1,.3,1) both;
  }

  /* Logo */
  .lp-logo {
    width: 56px; height: 56px;
    border-radius: 50%;
    border: 2px solid #e9ecef;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
    background: #f8f9fa;
  }

  /* Heading */
  .lp-heading {
    text-align: center;
    font-size: 28px;
    font-weight: 800;
    color: #1a1a2e;
    letter-spacing: -.02em;
    margin: 0 0 8px;
  }
  .lp-subhead {
    text-align: center;
    font-size: 13.5px;
    color: #868e96;
    line-height: 1.6;
    margin: 0 0 32px;
  }

  /* Error */
  .lp-error {
    background: #fff5f5;
    border: 1px solid #ffc9c9;
    color: #fa5252;
    font-size: 13px;
    padding: 11px 14px;
    border-radius: 10px;
    margin-bottom: 20px;
    text-align: center;
    animation: lpShake .35s cubic-bezier(.36,.07,.19,.97);
  }
  @keyframes lpShake {
    0%,100%{ transform:translateX(0) }
    20%    { transform:translateX(-5px) }
    40%    { transform:translateX(5px) }
    60%    { transform:translateX(-3px) }
    80%    { transform:translateX(3px) }
  }

  /* Fields */
  .lp-field { margin-bottom: 14px; }
  .lp-input-wrap { position: relative; }
  .lp-input {
    width: 100%;
    border: 1.5px solid #e9ecef;
    border-radius: 10px;
    padding: 13px 44px 13px 16px;
    font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1a1a2e;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    background: #fff;
  }
  .lp-input::placeholder { color: #adb5bd; }
  .lp-input:focus {
    border-color: #4c6ef5;
    box-shadow: 0 0 0 3px rgba(76,110,245,.1);
  }
  .lp-input-icon {
    position: absolute;
    right: 14px; top: 50%;
    transform: translateY(-50%);
    color: #ced4da;
    pointer-events: none;
  }
  .lp-input:focus ~ .lp-input-icon { color: #4c6ef5; }

  .lp-input-toggle {
    position: absolute;
    right: 14px; top: 50%;
    transform: translateY(-50%);
    color: #ced4da;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    cursor: pointer;
    line-height: 0;
  }
  .lp-input-toggle:hover { color: #495057; }
  .lp-input:focus ~ .lp-input-toggle { color: #4c6ef5; }

  /* Submit */
  .lp-btn {
    width: 100%;
    margin-top: 8px;
    padding: 14px;
    background: #3b5bdb;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14.5px;
    font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    transition: background .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 4px 20px rgba(59,91,219,.35);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .lp-btn:hover:not(:disabled) {
    background: #3451c7;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(59,91,219,.45);
  }
  .lp-btn:active:not(:disabled) { transform: translateY(0); }
  .lp-btn:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }

  .lp-spinner {
    width: 16px; height: 16px;
    border: 2.5px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lpSpin .65s linear infinite;
  }

  /* Microsoft button + divider */
  .lp-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
    color: #adb5bd;
    font-size: 12px;
  }
  .lp-divider::before, .lp-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e9ecef;
  }
  .lp-ms-btn {
    width: 100%;
    padding: 12px;
    background: #fff;
    color: #1a1a2e;
    border: 1.5px solid #e9ecef;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: border-color .2s, background .2s;
  }
  .lp-ms-btn:hover { border-color: #adb5bd; background: #f8f9fa; }

  /* Bottom note */
  .lp-bottom {
    margin-top: 28px;
    text-align: center;
    font-size: 13px;
    color: #868e96;
  }
  .lp-bottom span {
    color: #3b5bdb;
    font-weight: 600;
  }

  @keyframes lpFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lpSpin { to { transform: rotate(360deg); } }

  @media (max-width: 820px) {
    .lp-left  { display: none; }
    .lp-right { padding: 40px 28px; }
  }
`

export default function LoginPage() {
  const login      = useAuthStore(s => s.login)
  const error      = useAuthStore(s => s.error)
  const loading    = useAuthStore(s => s.loading)
  const clearError = useAuthStore(s => s.clearError)
  const isValid    = useAuthStore(s => s.isValid())

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [methods, setMethods] = useState<AuthMethods>({ ldap: true, microsoft: false })
  const [oauthError, setOauthError] = useState<string | null>(null)

  useEffect(() => {
    getAuthMethodsApi().then(setMethods)

    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'ms_auth_failed') {
      setOauthError('No se pudo iniciar sesión con Microsoft. Intenta de nuevo.')
    } else if (params.get('error') === 'ms_auth_state') {
      setOauthError('La sesión de inicio expiró. Intenta de nuevo.')
    }
  }, [])

  if (isValid) return <Navigate to="/" replace />

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login(username, password)
  }

  const handleMicrosoftLogin = () => {
    window.location.href = '/api/auth/microsoft'
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-root">

        {/* ══ LEFT PANEL ══ */}
        <div className="lp-left">

          {/* Confetti blobs */}
          <div className="lp-confetti">
            <div className="lp-blob" style={{ width:28, height:18, background:'#ff922b', top:'14%', right:'22%', transform:'rotate(30deg)' }} />
            <div className="lp-blob" style={{ width:22, height:14, background:'#51cf66', top:'22%', left:'28%', transform:'rotate(-20deg)' }} />
            <div className="lp-blob" style={{ width:18, height:26, background:'#20c997', top:'48%', right:'18%', transform:'rotate(50deg)' }} />
            <div className="lp-blob" style={{ width:24, height:16, background:'#ff6b6b', top:'10%', left:'52%', transform:'rotate(-40deg)' }} />
            <div className="lp-blob" style={{ width:20, height:13, background:'#ffd43b', top:'58%', left:'20%', transform:'rotate(15deg)' }} />
            <div className="lp-blob" style={{ width:26, height:17, background:'#845ef7', top:'72%', right:'28%', transform:'rotate(-30deg)' }} />
            <div className="lp-blob" style={{ width:16, height:22, background:'#f06595', top:'35%', left:'6%', transform:'rotate(60deg)' }} />
            <div className="lp-blob" style={{ width:30, height:20, background:'#74c0fc', top:'80%', left:'36%', transform:'rotate(-15deg)' }} />
            {/* curved lines like in original */}
            <svg style={{ position:'absolute', bottom:'18%', left:'6%', opacity:.6 }} width="60" height="40" viewBox="0 0 60 40" fill="none">
              <path d="M0 30 Q20 0 60 15" stroke="#a9c4ff" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M4 38 Q24 8 64 23" stroke="#a9c4ff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".5"/>
            </svg>
          </div>

          {/* Floating cards */}
          <div className="lp-cards">

            {/* Card 1 — task list */}
            <div className="lp-card lp-card1">
              <div className="lp-card1-header">
                <div className="lp-card1-tag">Frontend</div>
                <div className="lp-card1-title">Sprint de Diseño<br/>e Interfaces</div>
              </div>
              <div className="lp-card1-body">
                {[
                  { label:'Maquetado UI',   hrs:'6h',  color:'#4c6ef5' },
                  { label:'Componentes',    hrs:'8h',  color:'#51cf66' },
                  { label:'Revisión UX',   hrs:'3h',  color:'#ff922b' },
                ].map(row => (
                  <div key={row.label} className="lp-card1-row">
                    <div className="lp-card1-row-inner">
                      <div className="lp-card1-dot" style={{ background: row.color }} />
                      {row.label}
                    </div>
                    <span className="lp-card1-hrs">{row.hrs}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2 — team members */}
            <div className="lp-card lp-card2">
              <div className="lp-card2-inner">
                <div className="lp-card2-head">
                  <div className="lp-card2-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    </svg>
                  </div>
                  <div>
                    <div className="lp-card2-label">Equipo</div>
                    <div className="lp-card2-sub">3 miembros activos</div>
                  </div>
                </div>
                {[
                  { initials:'AC', name:'Andrea C.',  color:'#4c6ef5', hrs:'8h/día' },
                  { initials:'VM', name:'Victor M.',  color:'#51cf66', hrs:'6h/día' },
                  { initials:'KL', name:'Ken L.',     color:'#ff922b', hrs:'8h/día' },
                ].map(m => (
                  <div key={m.name} className="lp-card2-row">
                    <div className="lp-card2-av" style={{ background: m.color }}>{m.initials}</div>
                    <span style={{ flex:1 }}>{m.name}</span>
                    <span style={{ fontSize:10, color:'#adb5bd' }}>{m.hrs}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3 — small widget */}
            <div className="lp-card lp-card3">
              <div className="lp-card3-inner">
                <div className="lp-card3-play">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/>
                  </svg>
                </div>
                <div>
                  <div className="lp-card3-text">Avance 73%</div>
                  <div className="lp-card3-sub">Sprint actual</div>
                </div>
              </div>
            </div>

            {/* Floating mini icon */}
            <div className="lp-mini-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4c6ef5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>

          </div>{/* /lp-cards */}

          {/* Left footer */}
          <div className="lp-left-foot">
            <h2>Gestión de Proyectos<br />y Estimación</h2>
            <p>Planifica sprints, estima horas y controla<br />el avance de tus equipos.</p>
            <div className="lp-dots">
              <div className="lp-dot on" />
              <div className="lp-dot" />
              <div className="lp-dot" />
            </div>
          </div>

        </div>{/* /lp-left */}

        {/* ══ RIGHT PANEL ══ */}
        <div className="lp-right">
          <div className="lp-form-wrap">

            {/* Logo */}
            <div className="lp-logo">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>
              </svg>
            </div>

            <h1 className="lp-heading">¡Hola de nuevo!</h1>
            <p className="lp-subhead">Ingresa con tus credenciales corporativas<br />para continuar</p>

            {(error || oauthError) && (
              <div className="lp-error" key={error ?? oauthError}>{error ?? oauthError}</div>
            )}

            {methods.ldap && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="lp-field">
                <div className="lp-input-wrap">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); clearError() }}
                    placeholder="Usuario"
                    autoComplete="username"
                    autoFocus
                    required
                    className="lp-input"
                  />
                  <span className="lp-input-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                </div>
              </div>

              <div className="lp-field">
                <div className="lp-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); clearError() }}
                    placeholder="Contraseña"
                    autoComplete="current-password"
                    required
                    className="lp-input"
                  />
                  <button
                    type="button"
                    className="lp-input-toggle"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="lp-btn"
              >
                {loading ? (
                  <>
                    <span className="lp-spinner" />
                    Verificando…
                  </>
                ) : 'Iniciar sesión'}
              </button>
            </form>
            )}

            {methods.ldap && methods.microsoft && (
              <div className="lp-divider">o</div>
            )}

            {methods.microsoft && (
              <button
                type="button"
                className="lp-ms-btn"
                onClick={handleMicrosoftLogin}
              >
                <svg width="18" height="18" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                Iniciar sesión con Microsoft
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
