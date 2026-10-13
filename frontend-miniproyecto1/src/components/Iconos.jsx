export function IconoCheck({ className = '' }) {
  return (
    <svg className={`icono ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="m7.4 12.4 3.2 3.2 6-6.4" fill="none" stroke="var(--noche)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}