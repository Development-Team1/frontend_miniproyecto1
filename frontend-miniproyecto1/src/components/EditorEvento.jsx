import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import { fechaCorta } from '../lib/fechas'
import { LIMITE_POR_DEFECTO, analizarCarga, formatoNumero, horasPorDia, mensajeResuelto } from '../lib/carga'
import { IconoCheck } from './Iconos'

const TIPOS = ['Boda', 'Cumpleaños', 'Corporativo', 'Social', 'Otro']

let contador = 0
const nuevaGestion = (t = {}) => ({
  uid: ++contador,
  nombre: t.nombre ?? '',
  plazo: t.plazo ?? '',
  horas: t.horas_estimadas != null ? String(t.horas_estimadas) : '',
})

function ErrorCampo({ id, texto }) {
  return texto ? <span id={id} className="campo__error">{texto}</span> : null
}

// Confirmación de que un conflicto se resolvió, indicando qué cambio lo resolvió
function Confirmacion({ c }) {
  return (
    <div className="confirmacion" role="status">
      <IconoCheck />
      <div>
        <p className="confirmacion__titulo">{c.titulo}</p>
        <p className="confirmacion__detalle">{c.detalle}</p>
      </div>
    </div>
  )
}

// Aviso de sobrecarga diaria (US-07) con opciones para resolverla (Escenario 3)
function AvisoConflicto({ aviso, onSugerir, onElegirDia, onReducir }) {
  const { conflicto: c, sinEstaGestion, soloExcede, sugerencia } = aviso
  return (
    <div className="conflicto" role="status">
      <p className="conflicto__titulo">Ese día quedaría con demasiadas horas</p>
      <p>Quedarías con {formatoNumero(c.total)}h de gestión planificadas (límite {formatoNumero(c.limite)}h).</p>
      {sinEstaGestion > 0 && (
        <p className="conflicto__detalle">Sin contar esta gestión, ese día ya tienes {formatoNumero(sinEstaGestion)}h.</p>
      )}
      {soloExcede && (
        <p className="conflicto__detalle">Esta gestión sola supera tu límite diario. Redúcela o divídela en dos gestiones.</p>
      )}
      <div className="conflicto__acciones">
        <span className="conflicto__pregunta">¿Cómo lo resuelves?</span>
        {sugerencia && (
          <button type="button" className="btn btn--suave btn--chico" onClick={() => onSugerir(sugerencia.dia)}>
            {sugerencia.tipo === 'posponer' ? 'Posponer' : 'Adelantar'} al {fechaCorta(sugerencia.dia)}
          </button>
        )}
        <button type="button" className="btn btn--suave btn--chico" onClick={onElegirDia}>Elegir otro día</button>
        <button type="button" className="btn btn--suave btn--chico" onClick={onReducir}>Reducir las horas</button>
      </div>
      {!sugerencia && !soloExcede && (
        <p className="campo__ayuda">No encontramos un día libre antes del evento. Reduce las horas o cambia la fecha del evento.</p>
      )}
    </div>
  )
}

export default function EditorEvento({ evento, eventos = [], limite = LIMITE_POR_DEFECTO, onCerrar, onGuardado }) {
  const editando = Boolean(evento)
  const ref = useRef(null)
  const [datos, setDatos] = useState({
    nombre: evento?.nombre ?? '',
    tipo: evento?.tipo ?? '',
    fecha: evento?.fecha ?? '',
  })
  const [gestiones, setGestiones] = useState(() =>
    editando ? evento.tareas.map(nuevaGestion) : [nuevaGestion()],
  )
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Horas ya ocupadas por día en los demás eventos y conflictos del formulario actual
  const otros = useMemo(() => horasPorDia(eventos, evento?.id), [eventos, evento])
  const { conflictos, porUid: avisos } = useMemo(
    () => analizarCarga({ gestiones, otros, limite, fechaEvento: datos.fecha }),
    [gestiones, otros, limite, datos.fecha],
  )
  // Detecta cuándo un conflicto desaparece y qué acción del usuario lo resolvió
  const accionRef = useRef(null)
  const baseRef = useRef(null)
  const [confirmaciones, setConfirmaciones] = useState([])
  useEffect(() => {
    const accion = accionRef.current
    // Al escribir horas se espera un momento para no confirmar valores a medias
    const t = setTimeout(() => {
      const dias = new Set(conflictos.map((c) => c.dia))
      const previos = baseRef.current
      baseRef.current = dias
      accionRef.current = null
      if (!previos || !accion) return
      const resueltos = [...previos].filter((d) => !dias.has(d))
      if (resueltos.length === 0) return
      const msg = mensajeResuelto({ accion, gestiones, otros, limite, resueltos })
      if (msg) setConfirmaciones((prev) => [...prev.filter((c) => c.uid !== msg.uid), msg])
    }, accion?.tipo === 'horas' ? 700 : 0)
    return () => clearTimeout(t)
  }, [conflictos, gestiones, otros, limite])

  const enfocar = (id, abrirSelector) => {
    const el = ref.current?.querySelector(`#${id}`)
    if (!el) return
    el.focus()
    if (abrirSelector) {
      try { el.showPicker?.() } catch { /* el navegador no permite abrirlo */ }
    } else el.select?.()
  }

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal()
  }, [])

  const cambiarDato = (campo, valor) => {
    setDatos((p) => ({ ...p, [campo]: valor }))
    setErrores((p) => {
      const siguiente = { ...p, [campo]: undefined }
      // Al cambiar la fecha del evento se vuelven a evaluar los plazos al guardar
      if (campo === 'fecha') Object.keys(siguiente).forEach((k) => k.startsWith('plazo-') && (siguiente[k] = undefined))
      return siguiente
    })
  }
  const quitarGestion = (uid) => {
    const g = gestiones.find((x) => x.uid === uid)
    accionRef.current = { tipo: 'quitar', uid, nombre: g?.nombre }
    setGestiones((p) => p.filter((x) => x.uid !== uid))
  }
  const cambiarGestion = (uid, campo, valor) => {
    if (campo === 'plazo' || campo === 'horas') {
      const g = gestiones.find((x) => x.uid === uid)
      accionRef.current = { tipo: campo, uid, nombre: g?.nombre, horasAntes: Number(g?.horas) }
    }
    setGestiones((p) => p.map((g) => (g.uid === uid ? { ...g, [campo]: valor } : g)))
    setErrores((p) => ({ ...p, [`${campo}-${uid}`]: undefined }))
  }

  const validar = () => {
    const e = {}
    if (!datos.nombre.trim()) e.nombre = 'Escribe un nombre para el evento.'
    if (!datos.tipo) e.tipo = 'Elige qué tipo de evento es.'
    if (!datos.fecha) e.fecha = 'Elige la fecha del evento.'
    gestiones.forEach((g) => {
      if (!g.nombre.trim()) e[`nombre-${g.uid}`] = 'Describe qué hay que hacer, por ejemplo «Reservar el salón».'
      if (!g.plazo) e[`plazo-${g.uid}`] = 'Elige hasta cuándo debe estar lista.'
      else if (datos.fecha && g.plazo > datos.fecha)
        e[`plazo-${g.uid}`] = `El plazo no puede ser posterior a la fecha del evento (${fechaCorta(datos.fecha)}).`
      if (g.horas === '' || !(Number(g.horas) > 0)) e[`horas-${g.uid}`] = 'Escribe las horas estimadas (más de 0).'
    })
    return e
  }

  const guardar = async (ev) => {
    ev.preventDefault()
    setErrorServidor('')
    const e = validar()
    setErrores(e)
    const primero = Object.keys(e)[0]
    if (primero) {
      const el = ref.current.querySelector(`[data-campo="${primero}"]`)
      el?.focus()
      return
    }
    setGuardando(true)
    try {
      const guardado = await api(editando ? `/events/${evento.id}` : '/events', {
        method: editando ? 'PUT' : 'POST',
        body: {
          nombre: datos.nombre.trim(),
          tipo: datos.tipo,
          fecha: datos.fecha,
          tareas: gestiones.map((g) => ({
            nombre: g.nombre.trim(),
            plazo: g.plazo,
            horas_estimadas: Number(g.horas),
          })),
        },
      })
      onGuardado(guardado, editando)
    } catch (err) {
      setErrorServidor(err.message)
      setGuardando(false)
    }
  }

  const prop = (clave) => ({
    'data-campo': clave,
    'aria-invalid': errores[clave] ? 'true' : undefined,
    'aria-describedby': errores[clave] ? `err-${clave}` : undefined,
  })

  return (
    <dialog
      ref={ref}
      className="cajon"
      aria-labelledby="editor-titulo"
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
    >
      <form className="cajon__form" onSubmit={guardar} noValidate>
        <header className="cajon__cabecera">
          <h2 id="editor-titulo">{editando ? 'Editar evento' : 'Crear evento'}</h2>
          <button type="button" className="btn btn--texto btn--chico" onClick={onCerrar}>Cerrar</button>
        </header>

        <div className="cajon__cuerpo">
          <div className="campo">
            <label htmlFor="ev-nombre">Nombre del evento</label>
            <input
              id="ev-nombre" className="entrada" type="text" placeholder="Cumpleaños de Sofía"
              value={datos.nombre} onChange={(e) => cambiarDato('nombre', e.target.value)} {...prop('nombre')}
            />
            <ErrorCampo id="err-nombre" texto={errores.nombre} />
          </div>

          <fieldset className="campo pildoras-grupo">
            <legend>Tipo de evento</legend>
            <div className="pildoras">
              {TIPOS.map((t, i) => (
                <label key={t} className="pildora">
                  <input
                    type="radio" name="tipo" value={t} checked={datos.tipo === t}
                    onChange={() => cambiarDato('tipo', t)}
                    {...(i === 0 ? prop('tipo') : {})}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
            <ErrorCampo id="err-tipo" texto={errores.tipo} />
          </fieldset>

          <div className="campo">
            <label htmlFor="ev-fecha">Fecha del evento</label>
            <input
              id="ev-fecha" className="entrada" type="date"
              value={datos.fecha} onChange={(e) => cambiarDato('fecha', e.target.value)} {...prop('fecha')}
            />
            <ErrorCampo id="err-fecha" texto={errores.fecha} />
          </div>

          <section className="gestiones" aria-labelledby="gestiones-titulo">
            <div className="gestiones__cabecera">
              <h3 id="gestiones-titulo">Gestiones</h3>
              <p className="campo__ayuda">Cada pendiente del evento, con su plazo y las horas que calculas que te tomará.</p>
            </div>

            {gestiones.length === 0 && (
              <p className="gestiones__vacio">Aún no hay gestiones. Agrega la primera cuando quieras.</p>
            )}
            {confirmaciones.filter((c) => c.uid === null).map((c) => <Confirmacion key={c.titulo + c.detalle} c={c} />)}

            {gestiones.map((g, i) => (
              <div className="gestion" key={g.uid} role="group" aria-label={`Gestión ${i + 1}`}>
                <div className="campo">
                  <label htmlFor={`g-nombre-${g.uid}`}>Qué hay que hacer</label>
                  <input
                    id={`g-nombre-${g.uid}`} className="entrada" type="text" placeholder="Reservar el salón"
                    value={g.nombre} onChange={(e) => cambiarGestion(g.uid, 'nombre', e.target.value)}
                    {...prop(`nombre-${g.uid}`)}
                  />
                  <ErrorCampo id={`err-nombre-${g.uid}`} texto={errores[`nombre-${g.uid}`]} />
                </div>
                <div className="gestion__fila">
                  <div className="campo">
                    <label htmlFor={`g-plazo-${g.uid}`}>Plazo</label>
                    <input
                      id={`g-plazo-${g.uid}`} className="entrada" type="date" max={datos.fecha || undefined}
                      value={g.plazo} onChange={(e) => cambiarGestion(g.uid, 'plazo', e.target.value)}
                      {...prop(`plazo-${g.uid}`)}
                    />
                    <ErrorCampo id={`err-plazo-${g.uid}`} texto={errores[`plazo-${g.uid}`]} />
                  </div>
                  <div className="campo">
                    <label htmlFor={`g-horas-${g.uid}`}>Horas estimadas</label>
                    <input
                      id={`g-horas-${g.uid}`} className="entrada" type="number" inputMode="decimal" min="0" step="0.5" placeholder="2"
                      value={g.horas} onChange={(e) => cambiarGestion(g.uid, 'horas', e.target.value)}
                      {...prop(`horas-${g.uid}`)}
                    />
                    <ErrorCampo id={`err-horas-${g.uid}`} texto={errores[`horas-${g.uid}`]} />
                  </div>
                </div>
                {avisos.get(g.uid) && (
                  <AvisoConflicto
                    aviso={avisos.get(g.uid)}
                    onSugerir={(dia) => cambiarGestion(g.uid, 'plazo', dia)}
                    onElegirDia={() => enfocar(`g-plazo-${g.uid}`, true)}
                    onReducir={() => enfocar(`g-horas-${g.uid}`)}
                  />
                )}
                {!avisos.get(g.uid) && confirmaciones.filter((c) => c.uid === g.uid).map((c) => <Confirmacion key={c.titulo + c.detalle} c={c} />)}
                <button type="button" className="btn btn--texto btn--chico gestion__quitar" onClick={() => quitarGestion(g.uid)}>
                  Quitar gestión
                </button>
              </div>
            ))}

            <button type="button" className="btn btn--suave btn--chico" onClick={() => setGestiones((p) => [...p, nuevaGestion()])}>
              Agregar gestión
            </button>
          </section>
        </div>

        <footer className="cajon__pie">
          {conflictos.length > 0 && (
            <p className="alerta alerta--aviso" role="status">
              {conflictos.length === 1 ? 'Hay 1 día' : `Hay ${conflictos.length} días`} con más horas que tu límite diario de {formatoNumero(limite)}h.
              Puedes resolverlo en las gestiones o guardar de todos modos.
            </p>
          )}
          {errorServidor && <p className="alerta alerta--error" role="alert">{errorServidor}</p>}
          <div className="cajon__botones">
            <button type="button" className="btn btn--suave" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn btn--primario" disabled={guardando}>
              {guardando ? (editando ? 'Guardando…' : 'Creando…') : conflictos.length > 0 ? 'Guardar de todos modos' : editando ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}