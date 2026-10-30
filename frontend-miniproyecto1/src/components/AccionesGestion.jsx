import { useId, useMemo, useState } from 'react'
import { analizarPosposicion, analizarReapertura, cargaSinGestion, formatoNumero, textoProgreso, progresoDe } from '../lib/carga'
import { fechaCorta } from '../lib/fechas'
import { marcarHecha, posponerGestion, reabrirGestion, restaurarGestion } from '../lib/gestiones'

const horasTxt = (n) => `${formatoNumero(n)}h`

function textosConflicto(a, { evento, fecha, limite, reabrir }) {
  const p = a.problema
  switch (p.tipo) {
    case 'sin_ventana':
      return {
        titulo: 'No hay días disponibles antes del evento',
        detalle: `«${evento.nombre}» es el ${fechaCorta(evento.fecha)}: esta gestión ya no puede moverse a un día posterior sin pasar esa fecha.`,
      }
    case 'antes':
      return { titulo: 'Esa fecha no sirve para posponer', detalle: `Elige el ${fechaCorta(a.min)} o un día posterior.` }
    case 'evento':
      return {
        titulo: `El ${fechaCorta(fecha)} es después del evento`,
        detalle: `«${evento.nombre}» es el ${fechaCorta(evento.fecha)} y ninguna gestión puede vencer después de esa fecha.`,
      }
    default:
      return {
        titulo: reabrir
          ? `No se puede reabrir en su fecha: el ${fechaCorta(p.dia)} quedaría con ${horasTxt(p.total)} (límite ${horasTxt(limite)})`
          : `El ${fechaCorta(p.dia)} quedaría con ${horasTxt(p.total)} de gestión (límite ${horasTxt(limite)})`,
        detalle:
          p.ocupadas > 0
            ? `Ese día ya tiene ${horasTxt(p.ocupadas)} planificadas y esta gestión suma ${horasTxt(a.horas)}.`
            : `Esta gestión suma ${horasTxt(a.horas)} y por sí sola supera el límite diario.`,
      }
  }
}

function Conflicto({ titulo, detalle, opciones, ocupado }) {
  return (
    <div className="conflicto" aria-live="polite">
      <p className="conflicto__titulo">{titulo}</p>
      {detalle && <p className="conflicto__detalle">{detalle}</p>}
      {opciones.length > 0 ? (
        <div className="conflicto__acciones">
          <p className="conflicto__pregunta">¿Cómo quieres resolverlo?</p>
          {opciones.map((o) => (
            <button key={o.clave} type="button" className="btn btn--suave btn--chico" disabled={ocupado} onClick={o.aplicar}>
              {o.texto}
            </button>
          ))}
        </div>
      ) : (
        <p className="conflicto__detalle">No encontramos una solución automática: edita el evento para reorganizar sus gestiones.</p>
      )}
    </div>
  )
}

/*
 * Botones de una gestión: «Marcar como hecha» y «Posponer» (o «Reabrir» si ya está hecha).
 * `onActualizado(evento, mensaje)` recibe el evento tal como quedó en el servidor.
 */
export default function AccionesGestion({ evento, tarea, eventos, limite, onActualizado }) {
  const uid = useId()
  const [modo, setModo] = useState(null) // null | 'posponer' | 'reabrir'
  const [fecha, setFecha] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  const hecha = tarea.status === 'hecha'
  const nombre = tarea.nombre
  const horas = Number(tarea.horas_estimadas)

  const posp = useMemo(
    () => (modo === 'posponer' ? analizarPosposicion({ evento, tarea, eventos, limite, fecha }) : null),
    [modo, evento, tarea, eventos, limite, fecha],
  )
  const reab = useMemo(
    () => (modo === 'reabrir' ? analizarReapertura({ evento, tarea, eventos, limite }) : null),
    [modo, evento, tarea, eventos, limite],
  )

  // Horas ya planificadas en cada día sin contar esta gestión (para avisar de la carga antes de confirmar)
  const cargaOtros = useMemo(
    () => (modo === 'posponer' ? cargaSinGestion(eventos, tarea.id) : null),
    [modo, eventos, tarea.id],
  )

  const ejecutar = async (fn) => {
    setOcupado(true)
    setError('')
    try {
      const { evento: nuevo, mensaje } = await fn()
      setModo(null)
      // Cada acción se puede deshacer: se devuelve la gestión a como estaba antes (el aviso muestra el botón)
      onActualizado(nuevo, mensaje, () => restaurarGestion(evento, tarea))
    } catch (err) {
      if (err.evento) {
        setModo(null)
        onActualizado(err.evento, `La fecha o las horas ya se guardaron, pero no se pudo cambiar el estado: ${err.message}`)
      }
      setError(err.message)
    } finally {
      setOcupado(false)
    }
  }

  const hacerHecha = () =>
    ejecutar(async () => {
      const nuevo = await marcarHecha(evento, tarea)
      return { evento: nuevo, mensaje: `«${nombre}» marcada como hecha. ${textoProgreso(progresoDe(nuevo))}` }
    })

  const hacerPosponer = ({ plazo, horasNuevas, fechaEvento }) =>
    ejecutar(async () => {
      const nuevo = await posponerGestion(evento, tarea, { plazo, horas: horasNuevas, fechaEvento })
      const partes = [`«${nombre}» se pospuso del ${fechaCorta(tarea.plazo)} al ${fechaCorta(plazo)}.`]
      if (horasNuevas) partes.push(`Sus horas pasaron de ${horasTxt(horas)} a ${horasTxt(horasNuevas)}.`)
      if (fechaEvento) partes.push(`El evento ahora es el ${fechaCorta(fechaEvento)}.`)
      return { evento: nuevo, mensaje: partes.join(' ') }
    })

  const hacerReabrir = ({ plazo, horasNuevas, fechaEvento } = {}) =>
    ejecutar(async () => {
      const nuevo = await reabrirGestion(evento, tarea, { plazo, horas: horasNuevas, fechaEvento })
      const partes = [`«${nombre}» volvió a pendiente${plazo ? ` para el ${fechaCorta(plazo)}` : ''}.`]
      if (horasNuevas) partes.push(`Sus horas pasaron de ${horasTxt(horas)} a ${horasTxt(horasNuevas)}.`)
      if (fechaEvento) partes.push(`El evento ahora es el ${fechaCorta(fechaEvento)}.`)
      partes.push(textoProgreso(progresoDe(nuevo)))
      return { evento: nuevo, mensaje: partes.join(' ') }
    })

  const abrirPosponer = () => {
    if (modo === 'posponer') return setModo(null)
    setError('')
    const a = analizarPosposicion({ evento, tarea, eventos, limite, fecha: '' })
    setFecha(a.soluciones.alternativa?.dia ?? (a.problema?.tipo === 'sin_ventana' ? '' : a.min))
    setModo('posponer')
  }

  const abrirReabrir = () => {
    setError('')
    const a = analizarReapertura({ evento, tarea, eventos, limite })
    if (a.problema) setModo('reabrir')
    else hacerReabrir()
  }

  // Soluciones automáticas: cada botón aplica el arreglo y completa la acción de una vez.
  const opcionesPosponer = (a) => {
    const s = a.soluciones
    const lista = []
    if (s.alternativa) {
      const { dia, total } = s.alternativa
      lista.push({ clave: 'alt', texto: `Posponer al ${fechaCorta(dia)} (${horasTxt(total)} de ${horasTxt(limite)})`, aplicar: () => hacerPosponer({ plazo: dia }) })
    }
    if (s.reduccion) {
      lista.push({ clave: 'red', texto: `Reducir a ${horasTxt(s.reduccion.horas)} y posponer al ${fechaCorta(s.reduccion.dia)}`, aplicar: () => hacerPosponer({ plazo: s.reduccion.dia, horasNuevas: s.reduccion.horas }) })
    }
    if (s.extender) {
      lista.push({ clave: 'ext', texto: `Mover el evento al ${fechaCorta(s.extender.dia)} y posponer ahí`, aplicar: () => hacerPosponer({ plazo: s.extender.dia, fechaEvento: s.extender.dia }) })
    }
    return lista
  }

  const opcionesReabrir = (a) => {
    const s = a.soluciones
    const lista = []
    if (s.alternativa) {
      const { dia, total } = s.alternativa
      lista.push({ clave: 'alt', texto: `Reabrir para el ${fechaCorta(dia)} (${horasTxt(total)} de ${horasTxt(limite)})`, aplicar: () => hacerReabrir({ plazo: dia }) })
    }
    if (s.reduccion) {
      lista.push({ clave: 'red', texto: `Reabrir reduciendo a ${horasTxt(s.reduccion.horas)}`, aplicar: () => hacerReabrir({ horasNuevas: s.reduccion.horas }) })
    }
    if (s.extender) {
      lista.push({ clave: 'ext', texto: `Mover el evento al ${fechaCorta(s.extender.dia)} y reabrir ahí`, aplicar: () => hacerReabrir({ plazo: s.extender.dia, fechaEvento: s.extender.dia }) })
    }
    return lista
  }

  const conflictoPosp = posp?.problema && posp.problema.tipo !== 'sin_fecha'
  const idFecha = `${uid}-fecha`
  const idAyuda = `${uid}-ayuda`
  const idCarga = `${uid}-carga`

  return (
    <div className="acciones-gestion">
      <div className="acciones-gestion__botones">
        {hecha ? (
          <button type="button" className="btn btn--suave btn--chico" disabled={ocupado} onClick={abrirReabrir}>
            {ocupado && modo !== 'reabrir' ? 'Reabriendo…' : 'Reabrir'}
          </button>
        ) : (
          <>
            <button type="button" className="btn btn--suave btn--chico" disabled={ocupado} onClick={hacerHecha}>
              {ocupado && !modo ? 'Guardando…' : 'Marcar como hecha'}
            </button>
            <button
              type="button" className="btn btn--texto btn--chico" disabled={ocupado}
              aria-expanded={modo === 'posponer'} onClick={abrirPosponer}
            >
              Posponer
            </button>
          </>
        )}
      </div>

      {error && <p className="alerta alerta--error" role="alert">{error}</p>}

      {modo === 'posponer' && posp && (
        <div className="posponer" role="group" aria-label={`Posponer «${nombre}»`}>
          {posp.problema?.tipo !== 'sin_ventana' && (
            <div className="campo">
              <label htmlFor={idFecha}>Nueva fecha para «{nombre}»</label>
              <input
                id={idFecha} className="entrada" type="date" min={posp.min} value={fecha} disabled={ocupado}
                onChange={(e) => setFecha(e.target.value)}
                aria-invalid={conflictoPosp ? 'true' : undefined} aria-describedby={`${idAyuda} ${idCarga}`}
              />
              <p id={idAyuda} className="campo__ayuda">
                Plazo actual: {fechaCorta(tarea.plazo)} · Evento: {fechaCorta(evento.fecha)} · Límite diario: {horasTxt(limite)}
              </p>
              {fecha && cargaOtros && (
                <p id={idCarga} className="campo__ayuda">
                  El {fechaCorta(fecha)} ya tiene {horasTxt(cargaOtros.get(fecha) || 0)} planificadas; con esta gestión serían {horasTxt((cargaOtros.get(fecha) || 0) + horas)} de {horasTxt(limite)}.
                </p>
              )}
            </div>
          )}

          {conflictoPosp && (
            <Conflicto
              {...textosConflicto(posp, { evento, fecha, limite })}
              opciones={opcionesPosponer(posp)}
              ocupado={ocupado}
            />
          )}

          <div className="posponer__acciones">
            {posp.problema?.tipo !== 'sin_ventana' && (
              <button
                type="button" className="btn btn--primario btn--chico"
                disabled={ocupado || Boolean(posp.problema)}
                onClick={() => hacerPosponer({ plazo: fecha })}
              >
                {ocupado ? 'Guardando…' : 'Posponer'}
              </button>
            )}
            <button type="button" className="btn btn--texto btn--chico" disabled={ocupado} onClick={() => setModo(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {modo === 'reabrir' && reab?.problema && (
        <div className="posponer" role="group" aria-label={`Reabrir «${nombre}»`}>
          <Conflicto
            {...textosConflicto(reab, { evento, fecha: tarea.plazo, limite, reabrir: true })}
            opciones={opcionesReabrir(reab)}
            ocupado={ocupado}
          />
          <div className="posponer__acciones">
            <button type="button" className="btn btn--texto btn--chico" disabled={ocupado} onClick={() => setModo(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}