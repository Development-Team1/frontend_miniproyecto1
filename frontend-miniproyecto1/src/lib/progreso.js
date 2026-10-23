/*
 * Cálculos de la vista «Progreso».
 *
 * Cada gestión cae en UNA sola categoría, así que las cuatro suman el total:
 *   hecha      → status «hecha».
 *   vencida    → no está hecha y su plazo ya pasó (aunque esté pospuesta: sigue atrasada).
 *   pospuesta  → no está hecha, no ha vencido y fue pospuesta.
 *   pendiente  → el resto.
 * El porcentaje es hechas / total, igual que la barra de cada evento en «Eventos».
 */
import { hoyISO } from './hoy'

const redondear = (n) => Math.round(n * 100) / 100

export function estadoGestion(tarea, hoy = hoyISO()) {
  if (tarea.status === 'hecha') return 'hecha'
  if (tarea.plazo < hoy) return 'vencida'
  return tarea.status === 'pospuesta' ? 'pospuesta' : 'pendiente'
}

export function resumirGestiones(tareas, hoy = hoyISO()) {
  const r = { total: tareas.length, hechas: 0, pendientes: 0, pospuestas: 0, vencidas: 0, horasRestantes: 0 }
  for (const t of tareas) {
    const estado = estadoGestion(t, hoy)
    if (estado === 'hecha') {
      r.hechas++
      continue
    }
    if (estado === 'vencida') r.vencidas++
    else if (estado === 'pospuesta') r.pospuestas++
    else r.pendientes++
    r.horasRestantes += Number(t.horas_estimadas)
  }
  r.horasRestantes = redondear(r.horasRestantes)
  r.porcentaje = r.total ? (r.hechas * 100) / r.total : 0
  r.completo = r.total > 0 && r.hechas === r.total
  return r
}

// La gestión sin hacer cuyo plazo llega primero (desde hoy). Si hay empate, la de menos horas.
export function proximoPlazo(eventos, hoy = hoyISO()) {
  let mejor = null
  for (const e of eventos) {
    for (const t of e.tareas) {
      if (t.status === 'hecha' || t.plazo < hoy) continue
      const h = Number(t.horas_estimadas)
      if (!mejor || t.plazo < mejor.plazo || (t.plazo === mejor.plazo && h < mejor.horas)) {
        mejor = { plazo: t.plazo, nombre: t.nombre, horas: h, evento: e.nombre }
      }
    }
  }
  return mejor
}

export const FILTROS = [
  { clave: 'todos', texto: 'Todos', cumple: () => true },
  { clave: 'atencion', texto: 'Con vencidas', cumple: (r) => r.vencidas > 0 },
  { clave: 'curso', texto: 'En curso', cumple: (r) => r.total > 0 && !r.completo },
  { clave: 'listos', texto: 'Completos', cumple: (r) => r.completo },
]

// Primero los que aún tienen trabajo (por fecha del evento) y al final los completos.
export const compararTarjetas = (a, b) =>
  Number(a.r.completo) - Number(b.r.completo) ||
  a.evento.fecha.localeCompare(b.evento.fecha) ||
  a.evento.id - b.evento.id
