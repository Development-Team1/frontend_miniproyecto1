import { useEffect, useRef, useState } from 'react'
import Link from './Link'
import Logo from './Logo'
import { useAuth } from '../lib/auth-context'
import { usePath } from '../lib/router'

const SECCIONES = [
  { a: '/eventos', texto: 'Eventos' },
  { a: '/hoy', texto: 'Hoy' },
  { a: '/progreso', texto: 'Progreso' },
  { a: '/configuracion', texto: 'Configuración' },
]

// Debe coincidir con el punto de quiebre de la barra en hoy.css (1100px).
const ANCHO_ESCRITORIO = '(min-width: 1100px)'

export default function BarraApp() {
  const { user, cerrarSesion } = useAuth()
  const path = usePath()
  // El menú móvil solo está «abierto» en la ruta donde se abrió: al navegar se cierra solo.
  const [abiertoEn, setAbiertoEn] = useState(null)
  const boton = useRef(null)
  const abierto = abiertoEn === path

  useEffect(() => {
    if (!abierto) return
    const cerrar = () => setAbiertoEn(null)
    const alTeclear = (e) => {
      if (e.key !== 'Escape') return
      cerrar()
      boton.current?.focus()
    }
    const escritorio = window.matchMedia(ANCHO_ESCRITORIO)
    document.addEventListener('keydown', alTeclear)
    escritorio.addEventListener('change', cerrar)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      escritorio.removeEventListener('change', cerrar)
    }
  }, [abierto])

  return (
    <header className="panel__barra">
      <Logo to="/eventos" />

      <button
        ref={boton} type="button" className="panel__hamburguesa"
        aria-expanded={abierto} aria-controls="menu-principal"
        aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setAbiertoEn(abierto ? null : path)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" focusable="false">
          {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {abierto && <div className="panel__velo" aria-hidden="true" onClick={() => setAbiertoEn(null)} />}

      <div id="menu-principal" className={`panel__menu${abierto ? ' panel__menu--abierto' : ''}`}>
        <nav className="panel__nav" aria-label="Secciones">
          {SECCIONES.map((s) => (
            <Link key={s.a} to={s.a} aria-current={path === s.a ? 'page' : undefined}>
              {s.texto}
            </Link>
          ))}
        </nav>
        <div className="panel__usuario">
          <div className="panel__cuenta">
            <span className="panel__nombre" title={user.email}>{user.name}</span>
            <span className="panel__correo">{user.email}</span>
          </div>
          <button type="button" className="btn btn--suave btn--chico" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </div>
    </header>
  )
}