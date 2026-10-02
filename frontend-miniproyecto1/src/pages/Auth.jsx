import { useRef, useState } from 'react'
import Link from '../components/Link'
import Logo from '../components/Logo'
import { useAuth } from '../lib/auth-context'
import { navigate, useTitulo } from '../lib/router'
import { MENSAJE_SERVIDOR_LENTO, useAvisoLento } from '../lib/useAvisoLento'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const TEXTOS = {
  ingresar: {
    titulo: 'Inicia sesión',
    bajada: 'Entra para ver y organizar tus eventos.',
    accion: 'Iniciar sesión',
    cargando: 'Entrando…',
    lado: 'Tus eventos te esperan justo donde los dejaste.',
    cambio: { pregunta: '¿Primera vez aquí?', enlace: 'Crear una cuenta', a: '/registro' },
  },
  registro: {
    titulo: 'Crea tu cuenta',
    bajada: 'Solo necesitas tu nombre, un correo y una contraseña.',
    accion: 'Crear cuenta',
    cargando: 'Creando tu cuenta…',
    lado: 'En un minuto tendrás tu primer evento listo para armar.',
    cambio: { pregunta: '¿Ya tienes cuenta?', enlace: 'Inicia sesión', a: '/ingresar' },
  },
}

function ErrorCampo({ id, texto }) {
  return texto ? <span id={`${id}-error`} className="campo__error">{texto}</span> : null
}

function validar(modo, v) {
  const e = {}
  if (modo === 'registro' && !v.name.trim()) e.name = 'Escribe cómo quieres que te llamemos.'
  if (!v.email.trim()) e.email = 'Escribe tu correo electrónico.'
  else if (!EMAIL_VALIDO.test(v.email.trim())) e.email = 'Revisa el correo: debe verse como nombre@ejemplo.com.'
  if (!v.password) e.password = modo === 'registro' ? 'Crea una contraseña de al menos 8 caracteres.' : 'Escribe tu contraseña.'
  else if (modo === 'registro' && v.password.length < 8) e.password = 'La contraseña necesita al menos 8 caracteres.'
  return e
}

export default function Auth({ modo }) {
  const t = TEXTOS[modo]
  const { iniciarSesion, crearCuenta, aviso } = useAuth()
  const [valores, setValores] = useState({ name: '', email: '', password: '' })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [verClave, setVerClave] = useState(false)
  const formRef = useRef(null)
  const lento = useAvisoLento(enviando)
  useTitulo(`${t.titulo} · Mini-proyecto 1`)

  const cambiar = (campo) => (e) => {
    setValores((p) => ({ ...p, [campo]: e.target.value }))
    if (errores[campo]) setErrores((p) => ({ ...p, [campo]: undefined }))
  }

  const enviar = async (e) => {
    e.preventDefault()
    setErrorServidor('')
    const nuevos = validar(modo, valores)
    setErrores(nuevos)
    const primero = Object.keys(nuevos)[0]
    if (primero) {
      formRef.current?.elements[primero]?.focus()
      return
    }
    setEnviando(true)
    try {
      if (modo === 'registro') await crearCuenta(valores.name.trim(), valores.email.trim(), valores.password)
      else await iniciarSesion(valores.email.trim(), valores.password)
      navigate('/eventos', { replace: true })
    } catch (err) {
      setErrorServidor(err.message)
      setEnviando(false)
    }
  }

  const campoProps = (campo, extra = {}) => ({
    id: campo,
    name: campo,
    className: 'entrada',
    value: valores[campo],
    onChange: cambiar(campo),
    'aria-invalid': errores[campo] ? 'true' : undefined,
    'aria-describedby': errores[campo] ? `${campo}-error` : extra.ayuda ? `${campo}-ayuda` : undefined,
  })
  return (
    <div className="auth">
      <div className="auth__principal">
        <div className="auth__cabecera">
          <Logo />
          <Link to="/" className="auth__volver">Volver al inicio</Link>
        </div>

        <main className="auth__formulario">
          <h1>{t.titulo}</h1>
          <p className="auth__bajada">{t.bajada}</p>

          {aviso && modo === 'ingresar' && <p className="alerta alerta--info" role="status">{aviso}</p>}

          <form ref={formRef} onSubmit={enviar} noValidate>
            {modo === 'registro' && (
              <div className="campo">
                <label htmlFor="name">Nombre</label>
                <input {...campoProps('name')} type="text" autoComplete="name" placeholder="Ana Gómez" />
                <ErrorCampo id="name" texto={errores.name} />
              </div>
            )}

            <div className="campo">
              <label htmlFor="email">Correo electrónico</label>
              <input {...campoProps('email')} type="email" autoComplete="email" placeholder="nombre@ejemplo.com" />
              <ErrorCampo id="email" texto={errores.email} />
            </div>

            <div className="campo">
              <label htmlFor="password">Contraseña</label>
              <div className="entrada-con-boton">
                <input
                  {...campoProps('password', { ayuda: modo === 'registro' })}
                  type={verClave ? 'text' : 'password'}
                  autoComplete={modo === 'registro' ? 'new-password' : 'current-password'}
                />
                <button type="button" onClick={() => setVerClave((v) => !v)} aria-pressed={verClave}>
                  {verClave ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {modo === 'registro' && !errores.password && (
                <span id="password-ayuda" className="campo__ayuda">Mínimo 8 caracteres.</span>
              )}
              <ErrorCampo id="password" texto={errores.password} />
            </div>

            {errorServidor && <p className="alerta alerta--error" role="alert">{errorServidor}</p>}

            <button type="submit" className="btn btn--primario auth__enviar" disabled={enviando}>
              {enviando ? t.cargando : t.accion}
            </button>
            {lento && <p className="campo__ayuda" role="status">{MENSAJE_SERVIDOR_LENTO}</p>}
          </form>

          <p className="auth__cambio">
            {t.cambio.pregunta} <Link to={t.cambio.a}>{t.cambio.enlace}</Link>
          </p>
        </main>
      </div>

      <aside className="auth__lado" aria-hidden="true">
        <span className="auth__mancha" />
        <p>{t.lado}</p>
      </aside>
    </div>
  )
}
