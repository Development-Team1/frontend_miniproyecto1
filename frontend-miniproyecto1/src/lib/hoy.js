
import { diasHasta } from './fechas'

export const REGLA_ORDEN = [
  'Primero las vencidas, de la más antigua a la más reciente.',
  'Después las que vencen hoy.',
  'Al final las próximas, de la fecha más cercana a la más lejana.',
  'Si dos coinciden en fecha, va primero la de menor esfuerzo (menos horas estimadas).',
]

export const GRUPOS = [
  { clave: 'vencida', titulo: 'Gestiones vencidas', ayuda: 'Su plazo ya pasó. Atiéndelas primero.' },
  { clave: 'hoy', titulo: 'Para hoy', ayuda: 'Urgentes del día: vencen hoy.' },
  { clave: 'proxima', titulo: 'Próximas', ayuda: 'Vencen después de hoy, de la más cercana a la más lejana.' },
]

export function hoyISO() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function estadoDe(plazo) {
  const n = diasHasta(plazo)
  return n < 0 ? 'vencida' : n === 0 ? 'hoy' : 'proxima'
}

// Convierte la lista de eventos en una lista plana de gestiones, cada una con su evento.
export function aplanarGestiones(eventos) {
  return eventos.flatMap((e) =>
    e.tareas.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      plazo: t.plazo,
      horas: Number(t.horas_estimadas),
      dias: diasHasta(t.plazo),
      estado: estadoDe(t.plazo),
      evento: { id: e.id, nombre: e.nombre, tipo: e.tipo },
    })),
  )
}

export function compararGestiones(a, b) {
  return (
    a.plazo.localeCompare(b.plazo) ||
    a.horas - b.horas ||
    a.nombre.localeCompare(b.nombre, 'es') ||
    a.id - b.id
  )
}

export function agruparGestiones(gestiones) {
  const grupos = { vencida: [], hoy: [], proxima: [] }
  for (const g of gestiones) grupos[g.estado].push(g)
  for (const clave of Object.keys(grupos)) grupos[clave].sort(compararGestiones)
  return grupos
}

const dias = (n) => `${n} ${n === 1 ? 'día' : 'días'}`

export function textoPlazo(g, fechaCorta) {
  if (g.estado === 'vencida') return `Venció el ${fechaCorta(g.plazo)}, hace ${dias(-g.dias)}`
  if (g.estado === 'hoy') return 'Vence hoy'
  return g.dias === 1 ? 'Vence mañana' : `Vence el ${fechaCorta(g.plazo)}, en ${dias(g.dias)}`
}

export function marcaDe(g) {
  if (g.estado === 'hoy') return { grande: 'Hoy', chica: '' }
  const n = Math.abs(g.dias)
  return { grande: String(n), chica: n === 1 ? 'día' : 'días' }
}

export function resumenDe(gestiones) {
  const v = gestiones.filter((g) => g.estado === 'vencida').length
  const h = gestiones.filter((g) => g.estado === 'hoy').length
  if (gestiones.length === 0) return 'Aquí aparecerán tus gestiones.'
  const venc = `${v} ${v === 1 ? 'gestión vencida' : 'gestiones vencidas'}`
  const hoy = `${h} para hoy`
  if (v > 0 && h > 0) return `Tienes ${venc} y ${hoy}.`
  if (v > 0) return `Tienes ${venc}. No hay nada más para hoy.`
  if (h > 0) return `Tienes ${hoy}. No hay nada vencido.`
  return 'Estás al día: no hay nada vencido ni para hoy.'
}
