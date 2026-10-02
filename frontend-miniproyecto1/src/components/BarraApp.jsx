import Link from './Link'
import Logo from './Logo'
import { useAuth } from '../lib/auth-context'
import { usePath } from '../lib/router'

const SECCIONES = [
  { a: '/eventos', texto: 'Eventos' },
  { a: '/hoy', texto: 'Hoy' },
]

export default function BarraApp() {
  const { user, cerrarSesion } = useAuth()
  const path = usePath()

  return (
    <header className="panel__barra">
      <div className="panel__izq">
        <Logo to="/eventos" />
        <nav className="panel__nav" aria-label="Secciones">
          {SECCIONES.map((s) => (
            <Link key={s.a} to={s.a} aria-current={path === s.a ? 'page' : undefined}>
              {s.texto}
            </Link>
          ))}
        </nav>
      </div>
      <div className="panel__usuario">
        <span title={user.email}>{user.name}</span>
        <button type="button" className="btn btn--suave btn--chico" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    </header>
  )
}
