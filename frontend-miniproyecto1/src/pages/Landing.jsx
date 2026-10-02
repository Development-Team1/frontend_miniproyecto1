import { useEffect } from 'react'
import Link from '../components/Link'
import Logo from '../components/Logo'
import HiloEjemplo from '../components/HiloEjemplo'
import { useAuth } from '../lib/auth-context'
import { despertarServidor } from '../lib/api'
import { useTitulo } from '../lib/router'

const PASOS = [
  { titulo: 'Crea el evento', texto: 'Ponle nombre, elige qué tipo de evento es y marca la fecha.' },
  { titulo: 'Divídelo en gestiones', texto: 'Agrega cada pendiente con su plazo y las horas que calculas que te tomará.' },
  { titulo: 'Sigue el hilo', texto: 'Tus eventos se ordenan por fecha y siempre ves cuántos días faltan.' },
]

export default function Landing() {
  const { status } = useAuth()
  const conSesion = status === 'auth'
  useTitulo('Mini-proyecto 1 · Administrador de eventos')

  useEffect(() => {
    if (!conSesion) despertarServidor()
  }, [conSesion])

  return (
    <div className="landing">
      <header className="landing__barra">
        <Logo />
        <nav className="landing__acciones" aria-label="Cuenta">
          {conSesion ? (
            <Link to="/eventos" className="btn btn--primario btn--chico">Ir a mis eventos</Link>
          ) : (
            <>
              <Link to="/ingresar" className="btn btn--texto btn--chico">Iniciar sesión</Link>
              <Link to="/registro" className="btn btn--primario btn--chico">Crear cuenta</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero__texto">
            <h1>Organiza tu evento sin perder el hilo</h1>
            <p className="hero__bajada">
              Registra cada evento, divídelo en gestiones con su plazo y sus horas de trabajo, y ten siempre claro qué sigue.
            </p>
            <div className="hero__cta">
              {conSesion ? (
                <Link to="/eventos" className="btn btn--primario">Ir a mis eventos</Link>
              ) : (
                <>
                  <Link to="/registro" className="btn btn--primario">Crear mi cuenta</Link>
                  <Link to="/ingresar" className="btn btn--suave">Ya tengo cuenta</Link>
                </>
              )}
            </div>
            <p className="hero__nota">Solo tú puedes ver los eventos que creas.</p>
          </div>
          <HiloEjemplo />
        </section>

        <section className="pasos" aria-labelledby="titulo-pasos">
          <h2 id="titulo-pasos">Cómo funciona</h2>
          <ol className="pasos__lista">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="paso">
                <span className="paso__numero" aria-hidden="true">{i + 1}</span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="privado" aria-labelledby="titulo-privado">
          <div>
            <h2 id="titulo-privado">Tus eventos son solo tuyos</h2>
            <p>
              Cada cuenta tiene su propio espacio. Nadie más puede ver, cambiar ni borrar lo que tú creas, y tú tampoco ves lo de otras personas.
            </p>
          </div>
          {!conSesion && <Link to="/registro" className="btn btn--primario">Empezar ahora</Link>}
        </section>
      </main>

      <footer className="landing__pie">Mini-proyecto 1, Administrador de eventos</footer>
    </div>
  )
}
