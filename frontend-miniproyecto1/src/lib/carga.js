/*
 * Carga diaria (US-07 y US-12).
 *
 * Hay conflicto cuando, en un mismo día, la suma de horas estimadas de las gestiones
 * del usuario SUPERA su límite diario (si es igual al límite, no hay conflicto).
 * La suma incluye las gestiones de sus demás eventos y las del evento que se está editando.
 * El límite por defecto es 6 horas y el usuario lo configura entre 1 y 16.
 */
import { fechaCorta, leerFecha } from './fechas'
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

// ---------- Sobrecarga vista desde la lista de eventos ----------

// Días cuyo total de horas (sumando todos los eventos) supera el límite, con los eventos implicados.
export function diasSobrecargados(eventos, limite) {
  const porDia = new Map()
  for (const e of eventos) {
    for (const t of e.tareas) {
      const d = porDia.get(t.plazo) || { dia: t.plazo, total: 0, eventos: new Set() }
      d.total = redondear(d.total + Number(t.horas_estimadas))
      d.eventos.add(e.id)
      porDia.set(t.plazo, d)
    }
  }
  return [...porDia.values()]
    .filter((d) => d.total > limite + EPS)
    .map((d) => ({ ...d, limite }))
    .sort((a, b) => a.dia.localeCompare(b.dia))
}

export const sobrecargaDeEvento = (dias, eventoId) => dias.filter((d) => d.eventos.has(eventoId))

// "15 oct", "15 oct y 16 oct", "15 oct, 16 oct y 18 oct"
export function listarDias(dias) {
  const textos = dias.map((d) => fechaCorta(d))
  return textos.length <= 1 ? textos.join('') : `${textos.slice(0, -1).join(', ')} y ${textos[textos.length - 1]}`
}

// Mensajes de la lista tras guardar o eliminar: qué sobrecargas se resolvieron y cuáles siguen.
export function resumenSobrecarga({ antes, despues, eventoId }) {
  const hay = new Set(despues.map((d) => d.dia))
  const resueltos = antes.map((d) => d.dia).filter((d) => !hay.has(d))
  const propios = eventoId == null ? [] : sobrecargaDeEvento(despues, eventoId)
  return { resueltos, propios }
}

// ---------- Confirmación al resolver un conflicto dentro del formulario ----------

export const totalDelDia = (dia, gestiones, otros) => carga(dia, otros, horasDelFormulario(gestiones))

// accion: { tipo: 'plazo' | 'horas' | 'quitar', uid, nombre, horasAntes }
export function mensajeResuelto({ accion, gestiones, otros, limite, resueltos }) {
  const g = gestiones.find((x) => x.uid === accion.uid)
  const nombre = (accion.nombre || g?.nombre || '').trim() || 'sin nombre'
  let titulo
  if (accion.tipo === 'plazo' && g) titulo = `Se cambió la fecha de la gestión «${nombre}» al ${fechaCorta(g.plazo)} con éxito.`
  else if (accion.tipo === 'horas' && g) {
    const verbo = Number(g.horas) < accion.horasAntes ? 'redujeron' : 'cambiaron'
    titulo = `Se ${verbo} las horas de la gestión «${nombre}» a ${formatoNumero(Number(g.horas))}h con éxito.`
  } else if (accion.tipo === 'quitar') titulo = `Se quitó la gestión «${nombre}» con éxito.`
  else return null

  const detalle = resueltos
    .map((dia) => {
      const total = totalDelDia(dia, gestiones, otros)
      return total > 0
        ? `Se resolvió la sobrecarga del ${fechaCorta(dia)}: ahora suma ${formatoNumero(total)}h (límite ${formatoNumero(limite)}h).`
        : `Se resolvió la sobrecarga del ${fechaCorta(dia)}: ya no tiene horas planificadas.`
    })
    .join(' ')
  return { titulo, detalle, uid: accion.tipo === 'quitar' ? null : accion.uid }
}