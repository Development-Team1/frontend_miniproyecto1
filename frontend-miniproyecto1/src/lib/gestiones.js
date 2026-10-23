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
