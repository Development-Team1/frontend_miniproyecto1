/*
 * Acciones sobre una gestión, compartidas por las vistas «Eventos» y «Hoy».
 *
 * El servidor separa dos cosas:
 *   PATCH /tasks/{id}   cambia solo el estado (pendiente | hecha | pospuesta) y valida la reapertura.
 *   PUT   /events/{id}  cambia fecha y horas, y valida el límite diario y la fecha del evento.
 * Posponer = mover la fecha (PUT) + marcar «pospuesta» (PATCH). Al terminar se pide el evento de nuevo
 * para quedarse con el progreso calculado por el servidor.
 */
import { api } from './api'
import { cuerpoEvento } from './carga'

const traerEvento = (id) => api(`/events/${id}`)
const cambiarEstado = (tarea, status) => api(`/tasks/${tarea.id}`, { method: 'PATCH', body: { status } })

function guardarCambios(evento, tarea, { plazo, horas, fechaEvento }) {
  const cuerpo = cuerpoEvento(evento)
  if (fechaEvento) cuerpo.fecha = fechaEvento
  cuerpo.tareas = cuerpo.tareas.map((t) =>
    t.id === tarea.id ? { ...t, plazo: plazo ?? t.plazo, horas_estimadas: horas ?? t.horas_estimadas } : t,
  )
  return api(`/events/${evento.id}`, { method: 'PUT', body: cuerpo })
}

// Si el segundo paso falla, el primero ya quedó guardado: se devuelve el evento actualizado junto con el error.
async function pasoFinal(evento, paso) {
  try {
    await paso()
  } catch (err) {
    err.evento = await traerEvento(evento.id).catch(() => null)
    throw err
  }
  return traerEvento(evento.id)
}

export async function marcarHecha(evento, tarea) {
  await cambiarEstado(tarea, 'hecha')
  return traerEvento(evento.id)
}

// opciones: { plazo, horas, fechaEvento } (todas opcionales; sin ellas solo cambia el estado)
export async function reabrirGestion(evento, tarea, opciones = {}) {
  if (opciones.plazo || opciones.horas || opciones.fechaEvento) await guardarCambios(evento, tarea, opciones)
  return pasoFinal(evento, () => cambiarEstado(tarea, 'pendiente'))
}

// opciones: { plazo, horas?, fechaEvento? }
export async function posponerGestion(evento, tarea, opciones) {
  await guardarCambios(evento, tarea, opciones)
  return pasoFinal(evento, () => cambiarEstado(tarea, 'pospuesta'))
}

/*
 * Deshacer: devuelve la gestión (y la fecha del evento) a como estaban antes de la acción. `eventoAntes` y `tareaAntes`
 * son los objetos previos al cambio. Se parte del evento actual del servidor y se respeta el orden que exigen las reglas:
 *   - si antes estaba «hecha», primero se marca hecha (no cuenta en la carga) y después se devuelve la fecha;
 *   - en los demás casos primero se devuelve la fecha (el día original ya la admitía) y después el estado.
 */
export async function restaurarGestion(eventoAntes, tareaAntes) {
  const actual = await traerEvento(eventoAntes.id)
  const ahora = actual.tareas.find((t) => t.id === tareaAntes.id)
  if (!ahora) throw new Error('La gestión ya no existe.')

  const cambiaFecha = actual.fecha !== eventoAntes.fecha
  const cambiaGestion =
    ahora.plazo !== tareaAntes.plazo || Number(ahora.horas_estimadas) !== Number(tareaAntes.horas_estimadas)
  const cambiaEstado = ahora.status !== tareaAntes.status

  const devolverFecha = () =>
    guardarCambios(actual, tareaAntes, {
      plazo: tareaAntes.plazo,
      horas: tareaAntes.horas_estimadas,
      fechaEvento: cambiaFecha ? eventoAntes.fecha : undefined,
    })

  if (tareaAntes.status === 'hecha') {
    if (cambiaEstado) await cambiarEstado(tareaAntes, 'hecha')
    if (cambiaFecha || cambiaGestion) await devolverFecha()
  } else {
    if (cambiaFecha || cambiaGestion) await devolverFecha()
    if (cambiaEstado) await cambiarEstado(tareaAntes, tareaAntes.status)
  }
  return traerEvento(eventoAntes.id)
}