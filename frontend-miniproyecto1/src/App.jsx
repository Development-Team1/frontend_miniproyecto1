import { useEffect } from 'react'
import AuthProvider from './lib/AuthProvider'
import { useAuth } from './lib/auth-context'
import { navigate, usePath } from './lib/router'
import Link from './components/Link'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Eventos from './pages/Eventos'
import Hoy from './pages/Hoy'
import Configuracion from './pages/Configuracion'

function Rutas() {
  const path = usePath()
  const { status } = useAuth()
  const privada = path === '/eventos' || path === '/hoy' || path === '/configuracion'
  const deAcceso = path === '/ingresar' || path === '/registro'

  useEffect(() => {
    if (status === 'anon' && privada) navigate('/ingresar', { replace: true })
    if (status === 'auth' && deAcceso) navigate('/eventos', { replace: true })
  }, [status, privada, deAcceso])

  if (status === 'loading') return <div className="pantalla-carga" role="status">Retomando tu sesión…</div>
  if ((privada && status !== 'auth') || (deAcceso && status === 'auth')) return null

  if (path === '/') return <Landing />
  if (path === '/ingresar') return <Auth modo="ingresar" />
  if (path === '/registro') return <Auth modo="registro" />
  if (path === '/eventos') return <Eventos />
  if (path === '/hoy') return <Hoy />
  if (path === '/configuracion') return <Configuracion />
  return (
    <div className="pantalla-carga">
      <div style={{ textAlign: 'center' }}>
        <p>No encontramos esa página.</p>
        <p><Link to="/">Volver al inicio</Link></p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Rutas />
    </AuthProvider>
  )
}