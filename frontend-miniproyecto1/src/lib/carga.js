/*
 * Carga diaria (US-07 y US-12).
 *
 * Hay conflicto cuando, en un mismo día, la suma de horas estimadas de las gestiones
 * del usuario SUPERA su límite diario (si es igual al límite, no hay conflicto).
 * La suma incluye las gestiones de sus demás eventos y las del evento que se está editando.
 * El límite por defecto es 6 horas y el usuario lo configura entre 1 y 16.
 * Las gestiones ya hechas (status === 'hecha') no ocupan horas del día, así que no cuentan.
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
      if (t.status === 'hecha') continue
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
    if (g.uid === excluirUid || g.hecha || !g.plazo || !(h > 0)) continue
    mapa.set(g.plazo, redondear((mapa.get(g.plazo) || 0) + h))
  }
  return mapa
}

const carga = (dia, otros, propias) => redondear((otros.get(dia) || 0) + (propias.get(dia) || 0))

// Busca el día más cercano con espacio: primero hacia adelante (posponer) y, si no hay, hacia atrás (adelantar).
function buscarDia({ desde, tope, cabe, hoy }) {
  let d = sumarDias(desde, 1)
  if (d < hoy) d = hoy
  for (let i = 0; i < 366 && d <= tope; i++, d = sumarDias(d, 1)) {
    if (cabe(d)) return { dia: d, tipo: 'posponer' }
  }
  for (let i = 0, a = sumarDias(desde, -1); i < 366 && a >= hoy; i++, a = sumarDias(a, -1)) {
    if (cabe(a)) return { dia: a, tipo: 'adelantar' }
  }
  return null
}

export function sugerirDia({ gestion, gestiones, otros, limite, fechaEvento }) {
  const h = Number(gestion.horas)
  const propias = horasDelFormulario(gestiones, gestion.uid)
  return buscarDia({
    desde: gestion.plazo,
    tope: fechaEvento || sumarDias(gestion.plazo, 30),
    cabe: (dia) => carga(dia, otros, propias) + h <= limite + EPS,
    hoy: hoyISO(),
  })
}

// Horas a las que se puede reducir la gestión (múltiplos de 0,5) para que su día no supere el límite.
export function sugerirReduccion({ gestion, gestiones, otros, limite }) {
  const propias = horasDelFormulario(gestiones, gestion.uid)
  const libre = limite - carga(gestion.plazo, otros, propias)
  const max = Math.floor(libre * 2 + EPS) / 2
  return max >= 0.5 && max < Number(gestion.horas) ? max : null
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
    if (g.hecha || !c || !(h > 0)) continue
    porUid.set(g.uid, {
      conflicto: c,
      sinEstaGestion: redondear(c.total - h),
      soloExcede: h > limite + EPS,
      sugerencia: sugerirDia({ gestion: g, gestiones, otros, limite, fechaEvento }),
      reduccion: sugerirReduccion({ gestion: g, gestiones, otros, limite }),
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
      if (t.status === 'hecha') continue
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

// "15 oct", "15 oct y 16 oct", "15 oct, 16 oct y 18 oct"
export function listarDias(dias) {
  const textos = dias.map((d) => fechaCorta(d))
  return textos.length <= 1 ? textos.join('') : `${textos.slice(0, -1).join(', ')} y ${textos[textos.length - 1]}`
}

// Días cuya sobrecarga se resolvió entre dos estados de la lista de eventos
export function resumenSobrecarga({ antes, despues }) {
  const hay = new Set(despues.map((d) => d.dia))
  return { resueltos: antes.map((d) => d.dia).filter((d) => !hay.has(d)) }
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

// ---------- Ajuste automático al bajar el límite diario ----------

const MIN_HORAS = 0.5
const copiarEventos = (eventos) => eventos.map((e) => ({ ...e, tareas: e.tareas.map((t) => ({ ...t })) }))

// Días (desde hoy) que superan el límite, con las gestiones que los componen.
export function detalleSobrecarga(eventos, limite, desde = hoyISO()) {
  const mapa = new Map()
  for (const e of eventos) {
    for (const t of e.tareas) {
      if (t.status === 'hecha') continue
      const d = mapa.get(t.plazo) || { dia: t.plazo, total: 0, items: [] }
      const h = Number(t.horas_estimadas)
      d.total = redondear(d.total + h)
      d.items.push({ eventoId: e.id, eventoNombre: e.nombre, tareaId: t.id, nombre: t.nombre, horas: h })
      mapa.set(t.plazo, d)
    }
  }
  return [...mapa.values()].filter((d) => d.dia >= desde && d.total > limite + EPS).sort((a, b) => a.dia.localeCompare(b.dia))
}

const diasPorFecha = (copia) => {
  const carga = new Map()
  for (const e of copia) for (const t of e.tareas) if (t.status !== 'hecha') carga.set(t.plazo, redondear((carga.get(t.plazo) || 0) + Number(t.horas_estimadas)))
  return carga
}

const resultadoPlan = (copia, eventos, cambios, irresolubles) => {
  const tocados = new Set(cambios.map((c) => c.eventoId))
  return { cambios, irresolubles, factible: irresolubles.length === 0, eventosNuevos: copia.filter((e) => tocados.has(e.id)), original: eventos }
}

// Mueve gestiones de los días sobrecargados a los días más cercanos con espacio (sin pasar de la fecha del evento).
export function planReprogramar(eventos, limite, hoy = hoyISO()) {
  const copia = copiarEventos(eventos)
  const carga = diasPorFecha(copia)
  const cambios = []
  const irresolubles = []
  const dias = [...carga.keys()].filter((d) => d >= hoy && carga.get(d) > limite + EPS).sort()

  for (const dia of dias) {
    while (carga.get(dia) > limite + EPS) {
      const exceso = redondear(carga.get(dia) - limite)
      const candidatas = []
      for (const e of copia) for (const t of e.tareas) if (t.plazo === dia && t.status !== 'hecha') candidatas.push({ e, t, h: Number(t.horas_estimadas) })
      candidatas.sort((a, b) => a.h - b.h)
      // Primero la más pequeña que por sí sola resuelve el exceso; si no hay, las más grandes
      const orden = [...candidatas.filter((c) => c.h >= exceso - EPS), ...candidatas.filter((c) => c.h < exceso - EPS).reverse()]
      let movida = false
      for (const c of orden) {
        const destino = buscarDia({ desde: dia, tope: c.e.fecha, hoy, cabe: (d) => (carga.get(d) || 0) + c.h <= limite + EPS })
        if (!destino) continue
        carga.set(dia, redondear(carga.get(dia) - c.h))
        carga.set(destino.dia, redondear((carga.get(destino.dia) || 0) + c.h))
        c.t.plazo = destino.dia
        cambios.push({ tipo: 'fecha', eventoId: c.e.id, eventoNombre: c.e.nombre, tareaId: c.t.id, nombre: c.t.nombre, de: dia, a: destino.dia })
        movida = true
        break
      }
      if (!movida) {
        const grande = candidatas.find((c) => c.h > limite + EPS)
        irresolubles.push({
          dia,
          total: carga.get(dia),
          motivo: grande
            ? `La gestión «${grande.t.nombre}» del evento «${grande.e.nombre}» tiene ${formatoNumero(grande.h)}h y, por sí sola, supera el límite de ${formatoNumero(limite)}h: no cabe en ningún día.`
            : `El ${fechaCorta(dia)} no tiene otro día libre, antes de la fecha del evento, al que mover sus gestiones.`,
        })
        break
      }
    }
  }
  return resultadoPlan(copia, eventos, cambios, irresolubles)
}

// Reduce las horas de las gestiones de cada día sobrecargado, empezando por las más largas (mínimo 0,5h cada una).
export function planReducir(eventos, limite, hoy = hoyISO()) {
  const copia = copiarEventos(eventos)
  const carga = diasPorFecha(copia)
  const cambios = []
  const irresolubles = []
  const dias = [...carga.keys()].filter((d) => d >= hoy && carga.get(d) > limite + EPS).sort()

  for (const dia of dias) {
    let exceso = redondear(carga.get(dia) - limite)
    const items = []
    for (const e of copia) for (const t of e.tareas) if (t.plazo === dia && t.status !== 'hecha') items.push({ e, t, h: Number(t.horas_estimadas) })
    items.sort((a, b) => b.h - a.h)
    for (const it of items) {
      if (exceso <= EPS) break
      const posible = redondear(it.h - MIN_HORAS)
      if (posible <= EPS) continue
      const quitar = Math.min(exceso, posible)
      const nuevo = redondear(it.h - quitar)
      it.t.horas_estimadas = nuevo
      cambios.push({ tipo: 'horas', eventoId: it.e.id, eventoNombre: it.e.nombre, tareaId: it.t.id, nombre: it.t.nombre, de: it.h, a: nuevo, dia })
      exceso = redondear(exceso - quitar)
    }
    if (exceso > EPS) irresolubles.push({ dia, total: redondear(limite + exceso), motivo: `Las gestiones del ${fechaCorta(dia)} ya no se pueden reducir más (el mínimo es 0,5h por gestión).` })
  }
  return resultadoPlan(copia, eventos, cambios, irresolubles)
}

export const cuerpoEvento = (e) => ({
  nombre: e.nombre,
  tipo: e.tipo,
  fecha: e.fecha,
  tareas: e.tareas.map((t) => ({ id: t.id, nombre: t.nombre, plazo: t.plazo, horas_estimadas: Number(t.horas_estimadas) })),
})

// "«Prueba de menú» (Boda) del 16 de oct al 17 de oct" / "... de 5h a 4h"
export function describirCambio(c) {
  const gestion = `la gestión «${c.nombre}» del evento «${c.eventoNombre}»`
  return c.tipo === 'fecha'
    ? `Mover ${gestion} del ${fechaCorta(c.de)} al ${fechaCorta(c.a)}`
    : `Reducir ${gestion} de ${formatoNumero(c.de)}h a ${formatoNumero(c.a)}h`
}

export function confirmarCambio(c) {
  return c.tipo === 'fecha'
    ? `Se cambió la fecha de la gestión «${c.nombre}» del evento «${c.eventoNombre}», del ${fechaCorta(c.de)} al ${fechaCorta(c.a)}, con éxito.`
    : `Se redujeron las horas de la gestión «${c.nombre}» del evento «${c.eventoNombre}», de ${formatoNumero(c.de)}h a ${formatoNumero(c.a)}h, con éxito.`
}