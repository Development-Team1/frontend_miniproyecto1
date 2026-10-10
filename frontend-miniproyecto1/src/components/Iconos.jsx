export function IconoAdvertencia({ className = '' }) {
  return (
    <svg className={`icono ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3.6 21.4 20H2.6Z" fill="currentColor" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12 9.4v4.4" stroke="var(--noche)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="16.9" r="1.25" fill="var(--noche)" />
    </svg>
  )
}

export function IconoCheck({ className = '' }) {
  return (
    <svg className={`icono ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="m7.4 12.4 3.2 3.2 6-6.4" fill="none" stroke="var(--noche)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
