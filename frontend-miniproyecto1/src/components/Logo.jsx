import Link from './Link'

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="Mini-proyecto 1, Administrador de eventos. Ir al inicio">
      <svg className="logo__marca" viewBox="0 0 64 64" aria-hidden="true">
        <path fill="currentColor" d="M33 4c15 1 27 12 27 27 0 17-13 29-29 29C16 60 4 47 4 32 4 16 17 3 33 4Z" />
        <path d="M19 42c0-9 10-8 14-14s-2-12 12-10" fill="none" stroke="var(--noche)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="19" cy="43" r="4" fill="var(--noche)" />
        <circle cx="46" cy="18" r="4.5" fill="var(--noche)" />
      </svg>
      <span className="logo__texto">
        <strong>Mini-proyecto 1</strong>
        <span>Administrador de eventos</span>
      </span>
    </Link>
  )
}
