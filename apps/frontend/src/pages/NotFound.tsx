import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 text-slate-600">
      <span className="text-5xl font-bold text-slate-300">404</span>
      <p className="text-lg font-semibold">Página no encontrada</p>
      <Link to="/" className="text-[#1A5276] underline text-sm">Volver al inicio</Link>
    </div>
  )
}
