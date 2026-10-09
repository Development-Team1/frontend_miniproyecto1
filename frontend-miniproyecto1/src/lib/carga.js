/*
 * Carga diaria (US-07 y US-12).
 *
 * Hay conflicto cuando, en un mismo día, la suma de horas estimadas de las gestiones
 * del usuario SUPERA su límite diario (si es igual al límite, no hay conflicto).
 * La suma incluye las gestiones de sus demás eventos y las del evento que se está editando.
 * El límite por defecto es 6 horas y el usuario lo configura entre 1 y 16.
 */
import { leerFecha } from './fechas'
import { hoyISO } from './hoy'

export const LIMITE_POR_DEFECTO = 6

const redondear = (n) => Math.round(n * 100) / 100
const EPS = 1e-9

export const formatoNumero = (n) =>
  redondear(n).toLocaleString('es-CO', { maximumFractionDigits: 2 })

function isoDe(d) {
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function sumarDias(iso, n) {
  const d = leerFecha(iso)
  d.setDate(d.getDate() + n)
  return isoDe(d)
}

// Horas por día de los demás eventos del usuario (se excluye el evento que se edita).
export function horasPorDia(eventos, excluirEventoId) {
  const mapa = new Map()
  for (const e of eventos) {
    if (e.id === excluirEventoId) continue
    for (const t of e.tareas) {
      mapa.set(t.plazo, redondear((mapa.get(t.plazo) || 0) + Number(t.horas_estimadas)))
    }
  }
  return mapa
}

// Horas por día de las gestiones del formulario (cada una: { uid, plazo, horas }).
function horasDelFormulario(gestiones, excluirUid) {
  const mapa = new Map()
  for (const g of gestiones) {
    const h = Number(g.horas)
    if (g.uid === excluirUid || !g.plazo || !(h > 0)) continue
    mapa.set(g.plazo, redondear((mapa.get(g.plazo) || 0) + h))
  }
  return mapa
}

const carga = (dia, otros, propias) => redondear((otros.get(dia) || 0) + (propias.get(dia) || 0))

// Busca el día más cercano con espacio: primero hacia adelante (posponer) y, si no hay, hacia atrás (adelantar).
export function sugerirDia({ gestion, gestiones, otros, limite, fechaEvento }) {
  const h = Number(gestion.horas)
  const propias = horasDelFormulario(gestiones, gestion.uid)
  const cabe = (dia) => carga(dia, otros, propias) + h <= limite + EPS
  const hoy = hoyISO()
  const tope = fechaEvento || sumarDias(gestion.plazo, 30)

  let d = sumarDias(gestion.plazo, 1)
  if (d < hoy) d = hoy
  for (let i = 0; i < 366 && d <= tope; i++, d = sumarDias(d, 1)) {
    if (cabe(d)) return { dia: d, tipo: 'posponer' }
  }
  for (let i = 0, a = sumarDias(gestion.plazo, -1); i < 366 && a >= hoy; i++, a = sumarDias(a, -1)) {
    if (cabe(a)) return { dia: a, tipo: 'adelantar' }
  }
  return null
}

export function analizarCarga({ gestiones, otros, limite, fechaEvento }) {
  const propias = horasDelFormulario(gestiones)
  const conflictos = []
  for (const dia of propias.keys()) {
    const total = carga(dia, otros, propias)
    if (total > limite + EPS) conflictos.push({ dia, total, limite, ocupadas: otros.get(dia) || 0 })
  }
  conflictos.sort((a, b) => a.dia.localeCompare(b.dia))

  const porDia = new Map(conflictos.map((c) => [c.dia, c]))
  const porUid = new Map()
  for (const g of gestiones) {
    const c = porDia.get(g.plazo)
    const h = Number(g.horas)
    if (!c || !(h > 0)) continue
    porUid.set(g.uid, {
      conflicto: c,
      sinEstaGestion: redondear(c.total - h),
      soloExcede: h > limite + EPS,
      sugerencia: sugerirDia({ gestion: g, gestiones, otros, limite, fechaEvento }),
    })
  }
  return { conflictos, porUid }
}
