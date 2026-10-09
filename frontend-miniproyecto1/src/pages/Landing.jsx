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
    <div className="landing__pagina">
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

      <div className="landing">
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

          <section id="como-funciona" className="pasos" aria-labelledby="titulo-pasos">
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

          <section className="privado-seccion" aria-label="Privacidad de tus eventos">
            <section id="privacidad" className="privado" aria-labelledby="titulo-privado">
              <div>
                <h2 id="titulo-privado">Tus eventos son solo tuyos</h2>
                <p>
                  Cada cuenta tiene su propio espacio. Nadie más puede ver, cambiar ni borrar lo que tú creas, y tú tampoco ves lo de otras personas.
                </p>
              </div>
              {!conSesion && <Link to="/registro" className="btn btn--primario">Empezar ahora</Link>}
            </section>
          </section>



        </main>

        <footer className="landing__pie">
          <div className="landing__pie-contenido">
            <div className="landing__pie-marca">
              <Logo />
              <p>Organiza cada evento sin perder el hilo.</p>
              <span>© {new Date().getFullYear()} <a href="https://github.com/Development-Team1" target="_blank" rel="noopener noreferrer">
                Equipo de desarrollo
              </a>
              </span>
            </div>

            <nav className="landing__pie-nav" aria-label="Explora">
              <h2>Explora</h2>
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#privacidad">Privacidad</a>
            </nav>

            <nav className="landing__pie-nav" aria-label="Tu cuenta">
              <h2>Tu cuenta</h2>
              {conSesion ? (
                <Link to="/eventos">Ir a mis eventos</Link>
              ) : (
                <>
                  <Link to="/ingresar">Iniciar sesión</Link>
                  <Link to="/registro">Crear una cuenta</Link>
                </>
              )}
            </nav>

            <nav className="landing__pie-nav" aria-label="Desarrolladores">
              <h2>Desarrolladores</h2>
              <a href="https://www.instagram.com/romanserg_/" target="_blank" rel="noopener noreferrer">
                Sergio Muñoz Roman
              </a>
              <a href="https://www.instagram.com/eson.80/" target="_blank" rel="noopener noreferrer">
                Edwar Stiven Olaya
              </a>
              <a href="https://www.instagram.com/kathemorea389/" target="_blank" rel="noopener noreferrer">
                Katherine Morea Aranda
              </a>
              <a href="https://www.instagram.com/erikyulianx/" target="_blank" rel="noopener noreferrer">
                Erik Yulian Ochoa
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  )
}
